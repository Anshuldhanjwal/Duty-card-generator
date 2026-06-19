import { NextRequest, NextResponse } from 'next/server';

// ── Model configuration ────────────────────────────────────────────────────
// These are the CORRECT free model IDs that actually work on OpenRouter.
// OpenRouter :free models cost $0 credits.
const OPENROUTER_MODELS = [
  'google/gemini-2.0-flash-exp:free',              // Best: fast, vision, Hindi
  'meta-llama/llama-3.2-11b-vision-instruct:free', // Fallback 1
  'qwen/qwen2-vl-7b-instruct:free',               // Fallback 2
];

// Gemini direct — gemini-2.0-flash has 1000 req/DAY free (not 20!)
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

// ── Extraction prompt ──────────────────────────────────────────────────────
const PROMPT = `You are an expert OCR system for Hindi/Devanagari text in Indian police duty charts.

Extract all duty records from this image. Each record = one duty group (one main officer + their supporting staff assigned to one duty location).

RULES:
- Read ALL text carefully including Hindi numerals and ranks (उ0नि0, हे0का0, हो0गा0, म0का0 etc.)
- Extract EVERY officer. Do not skip anyone.
- mainOfficerName: the senior-most officer listed first (with rank)
- supportingOfficers: everyone listed under "सहयोगी पुलिसकमियों के नाम"
- dutyType: infer from context if not explicit (बैरियर ड्यूटी / गश्त ड्यूटी / चेकिंग ड्यूटी)
- dutyTime: extract exact text; default "प्रातः 08:00 बजे से रात्रि 20:00 बजे तक" if missing
- Leave all zonal/sector fields as empty strings ""

Return ONLY raw JSON with no markdown, no backticks, no explanation:
{
  "eventName": "काँवड़ यात्रा-2025",
  "district": "बुलन्दशहर",
  "dutyDateFrom": "11.07.2025",
  "dutyDateTo": "24.07.2025",
  "records": [
    {
      "dutyType": "बैरियर ड्यूटी",
      "mainOfficerName": "उ0नि0 श्री विजेन्द्र सिंह थाना को0देहात",
      "mainOfficerMobile": "7048980163",
      "supportingOfficers": [
        {"name": "हे0का01395 सुमित कुमार थाना को0देहात", "mobile": "8630641512"}
      ],
      "dutyPlace": "मामन तिराहा",
      "thanaArea": "कोतवाली देहात",
      "dutyTime": "प्रातः 08 बजे से रात्रि 20:00 बजे तक",
      "zonalMagistrate": "",
      "zonalPoliceOfficer": "",
      "sectorMagistrate": "",
      "sectorPoliceOfficer": ""
    }
  ]
}`;

// ── Helper: call OpenRouter ────────────────────────────────────────────────
async function tryOpenRouter(base64: string, mime: string, model: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://duty-card-generator.vercel.app',
      'X-Title': 'Police Duty Card Generator',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${model} → ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`OpenRouter ${model} returned empty content`);
  return content;
}

// ── Helper: call Gemini directly ──────────────────────────────────────────
async function tryGemini(base64: string, mime: string, model: string): Promise<string> {
  // Support comma-separated keys for rotation
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error('GEMINI_API_KEY not set');

  let lastErr = '';
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
            generationConfig: { maxOutputTokens: 2000, temperature: 0.1 },
          }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        lastErr = `Gemini ${model} key[...${apiKey.slice(-6)}] → ${res.status}: ${body.slice(0, 150)}`;
        continue; // try next key
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (e: any) {
      lastErr = e.message;
    }
  }
  throw new Error(lastErr);
}

// ── Helper: clean and parse JSON ──────────────────────────────────────────
function parseResult(raw: string): any {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  // Find the JSON object (sometimes model adds text before/after)
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ── Main route ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
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

      // 1. Try OpenRouter free models first
      for (const model of OPENROUTER_MODELS) {
        try {
          console.log(`[extract] Trying OpenRouter: ${model}`);
          raw = await tryOpenRouter(base64, mime, model);
          console.log(`[extract] ✓ OpenRouter success: ${model}`);
          break;
        } catch (e: any) {
          errors.push(`OpenRouter(${model}): ${e.message.slice(0, 100)}`);
          await new Promise(r => setTimeout(r, 300));
        }
      }

      // 2. Fallback to Gemini direct API
      if (!raw) {
        for (const model of GEMINI_MODELS) {
          try {
            console.log(`[extract] Trying Gemini: ${model}`);
            raw = await tryGemini(base64, mime, model);
            console.log(`[extract] ✓ Gemini success: ${model}`);
            break;
          } catch (e: any) {
            errors.push(`Gemini(${model}): ${e.message.slice(0, 100)}`);
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }

      if (!raw) {
        console.error('[extract] All providers failed:', errors);
        return NextResponse.json({
          error: 'सभी AI मॉडल विफल हो गए। कृपया कुछ मिनट बाद पुनः प्रयास करें।',
          details: errors,
        }, { status: 503 });
      }

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
