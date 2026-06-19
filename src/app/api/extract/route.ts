import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// API Keys — loaded from env vars.
// ─────────────────────────────────────────────────────────────────────────────
function getOpenRouterKey(): string {
  return process.env.OPENROUTER_API_KEY || '';
}

function getGeminiKeys(): string[] {
  return (process.env.GEMINI_API_KEY || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Model priority list — active free models supporting Hindi OCR & vision
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
  'gemini-2.5-flash',
];

const OPENROUTER_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];

// ─────────────────────────────────────────────────────────────────────────────
// JSON Schema for Gemini Direct structured output
// ─────────────────────────────────────────────────────────────────────────────
const JSON_SCHEMA = {
  type: "OBJECT",
  properties: {
    eventName: { type: "STRING" },
    district: { type: "STRING" },
    dutyDateFrom: { type: "STRING" },
    dutyDateTo: { type: "STRING" },
    records: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          dutyType: { type: "STRING" },
          mainOfficerName: { type: "STRING" },
          mainOfficerMobile: { type: "STRING" },
          supportingOfficers: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                mobile: { type: "STRING" }
              },
              required: ["name", "mobile"]
            }
          },
          dutyPlace: { type: "STRING" },
          thanaArea: { type: "STRING" },
          dutyTime: { type: "STRING" },
          zonalMagistrate: { type: "STRING" },
          zonalPoliceOfficer: { type: "STRING" },
          sectorMagistrate: { type: "STRING" },
          sectorPoliceOfficer: { type: "STRING" }
        },
        required: [
          "dutyType", 
          "mainOfficerName", 
          "mainOfficerMobile", 
          "supportingOfficers", 
          "dutyPlace", 
          "thanaArea", 
          "dutyTime"
        ]
      }
    }
  },
  required: ["eventName", "district", "dutyDateFrom", "dutyDateTo", "records"]
};

// ─────────────────────────────────────────────────────────────────────────────
// Extraction prompt — strict, JSON layout instruction
// ─────────────────────────────────────────────────────────────────────────────
const PROMPT = `You are an expert OCR system for Hindi/Devanagari text in Indian police duty charts.

Extract all duty records from this image. Each record = one duty group (one main officer + their supporting staff assigned to one duty location).

RULES:
- Read ALL text carefully including Hindi numerals and ranks (उ0नि0, हे0का0, हो0गा0, म0का0 etc.)
- Extract EVERY officer listed. Do not skip anyone.
- mainOfficerName: the senior-most officer listed first (with rank prefix)
- supportingOfficers: all staff listed under the main officer for that location
- dutyType: extract or infer (बैरियर ड्यूटी / गश्त ड्यूटी / चेकिंग ड्यूटी / अस्थायी चौकी ड्यूटी)
- dutyTime: extract exact text from image; if missing use "प्रातः 08:00 बजे से रात्रि 20:00 बजे तक"
- Set all zonal/sector fields to empty string ""`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: call Google Gemini directly via REST (no SDK needed)
// ─────────────────────────────────────────────────────────────────────────────
async function tryGemini(base64: string, mime: string, model: string): Promise<string> {
  const keys = getGeminiKeys();
  if (keys.length === 0) throw new Error('GEMINI_API_KEY not configured in Vercel environment variables');

  for (const apiKey of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mime, data: base64 } },
                { text: PROMPT },
              ],
            }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: JSON_SCHEMA,
              temperature: 0.1,
            },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        console.warn(`[extract] Gemini key ...${apiKey.slice(-8)} failed (${res.status}): ${body.slice(0, 100)}`);
        continue; // rotate to next key
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');
      return text;

    } catch (e: any) {
      console.warn(`[extract] Gemini key ...${apiKey.slice(-8)} error: ${e.message}`);
      // continue to next key
    }
  }

  throw new Error(`All ${keys.length} Gemini key(s) failed for model ${model}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: call OpenRouter (OpenAI-compatible vision API)
// ─────────────────────────────────────────────────────────────────────────────
async function tryOpenRouter(base64: string, mime: string, model: string): Promise<string> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('OPENROUTER_API_KEY not configured in Vercel environment variables');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://duty-card-generator.vercel.app',
      'X-Title': 'Police Duty Card Generator',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          { type: 'text', text: PROMPT + '\nReturn ONLY a raw valid JSON object matching the requested schema.' },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();

  // Handle OpenRouter error objects returned with 200 status
  if (data.error) {
    throw new Error(`API error: ${JSON.stringify(data.error).slice(0, 200)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from model');
  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: strip markdown fences and extract the JSON object
// ─────────────────────────────────────────────────────────────────────────────
function parseResult(raw: string): any {
  let cleaned = raw.trim();

  // Strip markdown fences
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the outermost JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`Model did not return JSON. Got: ${raw.slice(0, 200)}`);
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnose configuration issues upfront for better error messages
// ─────────────────────────────────────────────────────────────────────────────
function diagnoseMissingConfig(): string | null {
  const hasOpenRouter = !!getOpenRouterKey();
  const hasGemini = getGeminiKeys().length > 0;
  if (!hasOpenRouter && !hasGemini) {
    return 'No API keys configured. Please set GEMINI_API_KEY and/or OPENROUTER_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main POST handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Check config first — gives a clear error instead of cryptic "all models failed"
    const configError = diagnoseMissingConfig();
    if (configError) {
      console.error('[extract] Config error:', configError);
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'कोई छवि नहीं मिली' }, { status: 400 });
    }

    const allRecords: any[] = [];
    let meta = { eventName: '', district: '', dutyDateFrom: '', dutyDateTo: '' };

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mime = file.type || 'image/jpeg';

      let raw: string | null = null;
      const errors: string[] = [];

      // ── Step 1: Try Gemini direct API first (Primary) ───────────────────
      if (getGeminiKeys().length > 0) {
        for (const model of GEMINI_MODELS) {
          try {
            console.log(`[extract] → Gemini direct: ${model}`);
            raw = await tryGemini(base64, mime, model);
            console.log(`[extract] ✓ Success: ${model}`);
            break;
          } catch (e: any) {
            const msg = `Gemini(${model}): ${e.message.slice(0, 120)}`;
            errors.push(msg);
            console.warn(`[extract] ✗ ${msg}`);
            await new Promise(r => setTimeout(r, 400));
          }
        }
      }

      // ── Step 2: Fallback to OpenRouter free models (Secondary) ──────────
      if (!raw && getOpenRouterKey()) {
        for (const model of OPENROUTER_MODELS) {
          try {
            console.log(`[extract] → OpenRouter: ${model}`);
            raw = await tryOpenRouter(base64, mime, model);
            console.log(`[extract] ✓ Success: ${model}`);
            break;
          } catch (e: any) {
            const msg = `OpenRouter(${model.split('/')[1] || model}): ${e.message.slice(0, 120)}`;
            errors.push(msg);
            console.warn(`[extract] ✗ ${msg}`);
            await new Promise(r => setTimeout(r, 400));
          }
        }
      }

      // ── All failed ───────────────────────────────────────────────────────
      if (!raw) {
        console.error('[extract] ALL providers failed:', errors);
        return NextResponse.json({
          error: `सभी AI मॉडल विफल हो गए। कृपया कुछ मिनट बाद पुनः प्रयास करें।\n\nTechnical details:\n${errors.join('\n')}`,
          details: errors,
        }, { status: 503 });
      }

      // ── Parse and collect ────────────────────────────────────────────────
      const parsed = parseResult(raw);

      if (!meta.eventName && parsed.eventName) {
        meta = {
          eventName: parsed.eventName || '',
          district: parsed.district || '',
          dutyDateFrom: parsed.dutyDateFrom || '',
          dutyDateTo: parsed.dutyDateTo || '',
        };
      }

      const records = (parsed.records || []).map((r: any, i: number) => ({
        ...r,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
      }));
      allRecords.push(...records);
    }

    return NextResponse.json({ ...meta, records: allRecords });

  } catch (err: any) {
    console.error('[extract] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
