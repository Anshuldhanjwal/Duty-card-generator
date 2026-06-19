import { NextRequest, NextResponse } from 'next/server';

const MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-2.5-flash-exp-0827:free',
  'meta-llama/llama-4-maverick:free',
  'microsoft/phi-4-multimodal-instruct:free',
];

const EXTRACTION_PROMPT = `You are an expert OCR system for Hindi/Devanagari text in Indian police duty charts.
Extract all duty records from this image. Each record = one duty group (one main officer + their supporting staff assigned to one location).

IMPORTANT RULES:
1. Read ALL text carefully, including Hindi numerals.
2. Extract EVERY officer/staff member, do not skip any.
3. If duty type is not explicitly stated, infer from context (e.g. "बैरियर ड्यूटी", "गश्त ड्यूटी", "चेकिंग ड्यूटी").
4. For dutyTime, extract exact timing; if not found use "प्रातः 08:00 बजे से रात्रि 20:00 बजे तक".
5. Leave zonalMagistrate, zonalPoliceOfficer, sectorMagistrate, sectorPoliceOfficer as empty strings.

Return ONLY valid JSON, no markdown backticks, no explanation:
{
  "eventName": "string (e.g. काँवड़ यात्रा-2025)",
  "district": "string (e.g. बुलन्दशहर)",
  "dutyDateFrom": "string (e.g. 11.07.2025)",
  "dutyDateTo": "string (e.g. 24.07.2025)",
  "records": [
    {
      "dutyType": "string",
      "mainOfficerName": "string (full name with rank)",
      "mainOfficerMobile": "string",
      "supportingOfficers": [
        { "name": "string", "mobile": "string" }
      ],
      "dutyPlace": "string",
      "thanaArea": "string",
      "dutyTime": "string",
      "zonalMagistrate": "",
      "zonalPoliceOfficer": "",
      "sectorMagistrate": "",
      "sectorPoliceOfficer": ""
    }
  ]
}`;

async function extractWithOpenRouter(
  base64Data: string, 
  mediaType: string, 
  model: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://duty-card-generator.vercel.app',
      'X-Title': 'Police Duty Card Generator',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Data}` } },
          { type: 'text', text: EXTRACTION_PROMPT }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter ${model} failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function extractWithGeminiDirect(
  base64Data: string,
  mediaType: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mediaType,
                  data: base64Data
                }
              },
              {
                text: EXTRACTION_PROMPT
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Direct Gemini API failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJSON(text: string) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    cleaned = markdownMatch[1];
  }
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Support both 'images' and 'files' to be compatible with frontend & requests
    let files = formData.getAll('images') as File[];
    if (!files || files.length === 0) {
      files = formData.getAll('files') as File[];
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images or files provided' }, { status: 400 });
    }

    const allRecords: any[] = [];
    let eventMeta = { eventName: '', district: '', dutyDateFrom: '', dutyDateTo: '' };

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64Data = Buffer.from(bytes).toString('base64');
      const mediaType = file.type || 'image/jpeg';

      let extracted: any = null;
      let lastError: Error | null = null;

      // Try each model in order until one works
      for (const model of MODELS) {
        try {
          console.log(`Trying model: ${model}`);
          const text = await extractWithOpenRouter(base64Data, mediaType, model);
          extracted = parseJSON(text);
          console.log(`Success with model: ${model}`);
          break;
        } catch (err: any) {
          console.error(`Model ${model} failed:`, err.message);
          lastError = err;
          // Small delay before trying next model
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // Secondary fallback to direct Gemini API if OpenRouter failed
      if (!extracted && process.env.GEMINI_API_KEY) {
        try {
          console.log('Trying secondary fallback: Direct Gemini API');
          const text = await extractWithGeminiDirect(base64Data, mediaType);
          extracted = parseJSON(text);
          console.log('Success with secondary fallback: Direct Gemini API');
        } catch (err: any) {
          console.error('Direct Gemini fallback failed:', err.message);
          lastError = err;
        }
      }

      if (!extracted) {
        return NextResponse.json(
          { error: `All models failed. Last error: ${lastError?.message}` },
          { status: 500 }
        );
      }

      // Merge event metadata from first successful extraction
      if (!eventMeta.eventName && extracted.eventName) {
        eventMeta = {
          eventName: extracted.eventName,
          district: extracted.district,
          dutyDateFrom: extracted.dutyDateFrom,
          dutyDateTo: extracted.dutyDateTo,
        };
      }

      // Add unique IDs to records
      const records = (extracted.records || []).map((r: any, i: number) => ({
        ...r,
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      }));
      allRecords.push(...records);
    }

    return NextResponse.json({ ...eventMeta, records: allRecords });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
