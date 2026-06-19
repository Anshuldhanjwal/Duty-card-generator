import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to execute generateContent with automatic retry on 503 and fallback to other models
// Helper function to execute generateContent with rotation through multiple Gemini API keys and OpenRouter fallback
async function generateTextWithFallback(
  apiKeys: string[],
  payload: {
    prompt: string;
    mediaType: string;
    base64Image: string;
  },
  primaryModel: string
): Promise<string> {
  const modelsToTry = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite'
  ];
  
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;
  
  // Try direct Gemini API keys and models first
  for (const modelName of uniqueModels) {
    for (const apiKey of apiKeys) {
      console.log(`Attempting generation with model: ${modelName} using key: ${apiKey.substring(0, 10)}...`);
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await model.generateContent({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: payload.mediaType,
                        data: payload.base64Image
                      }
                    },
                    {
                      text: payload.prompt
                    }
                  ]
                }
              ]
            });
            const text = result.response.text ? result.response.text() : '';
            console.log(`Success with model ${modelName} using key ${apiKey.substring(0, 10)}... on attempt ${attempt}`);
            return text;
          } catch (err: any) {
            lastError = err;
            const errMsg = err.message || '';
            const is503 = errMsg.includes('503') || errMsg.toLowerCase().includes('service unavailable');
            const isRateLimit = errMsg.includes('429') || 
                                errMsg.toLowerCase().includes('too many requests') || 
                                errMsg.toLowerCase().includes('resource has been exhausted') ||
                                errMsg.toLowerCase().includes('quota');
            
            console.warn(`Model ${modelName} using key ${apiKey.substring(0, 10)}... attempt ${attempt} failed: ${errMsg}`);
            
            if (isRateLimit) {
              console.warn(`Rate limit or resource exhaustion detected for key. Moving to the next API key immediately.`);
              break; // Skip to next key immediately
            }
            
            if (is503 && attempt < maxRetries) {
              const delay = attempt * 1500;
              console.log(`Retrying ${modelName} in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              break; // Move to next key if not retryable or max retries exceeded
            }
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed to initialize or execute model ${modelName} with key ${apiKey.substring(0, 10)}...:`, err.message || err);
      }
    }
  }

  // OpenRouter Fallback
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
  
  if (openRouterKey) {
    console.log(`All Gemini keys failed. Falling back to OpenRouter using model: ${openRouterModel}`);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/Anshuldhanjwal/Duty-card-generator',
          'X-Title': 'Police Duty Card Generator'
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: payload.prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${payload.mediaType};base64,${payload.base64Image}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errText}`);
      }

      const data = await response.json();
      const textResult = data.choices?.[0]?.message?.content || '';
      if (!textResult) {
        throw new Error('OpenRouter response returned empty content');
      }
      console.log('Success with OpenRouter fallback!');
      return textResult;
    } catch (orErr: any) {
      console.error('OpenRouter fallback failed:', orErr.message || orErr);
      throw orErr;
    }
  }
  
  throw lastError || new Error('All Gemini models and fallback keys failed to generate content');
}

export async function POST(req: NextRequest) {
  try {
    const geminiKeysEnv = process.env.GEMINI_API_KEYS || '';
    const geminiKeySingle = process.env.GEMINI_API_KEY || '';
    
    let apiKeys = geminiKeysEnv
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    
    if (geminiKeySingle && !apiKeys.includes(geminiKeySingle)) {
      apiKeys.unshift(geminiKeySingle);
    }
    
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY or GEMINI_API_KEYS to your .env.local file.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const allRecords: any[] = [];
    let eventName = 'काँवड़ यात्रा-2025';
    let district = 'बुलन्दशहर';
    let dutyDateFrom = '11.07.2025';
    let dutyDateTo = '24.07.2025';

    // Process each file with Gemini Vision model
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Image = buffer.toString('base64');
      const mediaType = file.type || 'image/jpeg';

      const responseText = await generateTextWithFallback(
        apiKeys,
        {
          prompt: `You extract Hindi police duty chart data from the provided image.
Analyze the columns smartly:
1. If a row/location contains multiple shifts (e.g. Day Shift / "सुबह 08.00 बजे से 20.00 बजे तक" and Night Shift / "रात्रि 20.00 बजे से 08.00 बजे तक"), extract them as separate, individual records.
2. For each record:
   - Identify the main duty officer (e.g. Sub-Inspector "उ0नि0" or Inspector "निरीक्षक" or "Reserve Officer") and their mobile number.
   - Extract all supporting staff members (e.g. Head Constable "हे0का0", Constable "का0", Home Guard "हो0गा0", Female Constable "म0का0") and their respective mobile numbers.
   - Extract the duty location/place (e.g. "मामन तिराहा", "डी.पी.एस तिराहा").
   - Extract the Thana area (e.g. "कोतवाली देहात", "औरंगाबाद", "सिकन्दराबाद").
   - Extract the duty type (e.g. "बैरियर ड्यूटी", "अस्थायी चौकी ड्यूटी", etc.).
   - Extract the specific duty time/shift (e.g. "सुबह 08.00 बजे से रात्रि 20.00 बजे तक" or "रात्रि 20.00 बजे से सुबह 08.00 बजे तक").

Return ONLY a single valid JSON block without any markdown wrapping (no \`\`\`json) and no conversational text.

JSON format:
{
  "eventName": "काँवड़ यात्रा-2025",
  "district": "बुलन्दशहर",
  "dutyDateFrom": "11.07.2025",
  "dutyDateTo": "24.07.2025",
  "records": [{
    "dutyType": "बैरियर ड्यूटी",
    "mainOfficerName": "उ0नि0 श्री विजेन्द्र सिंह थाना को0देहात",
    "mainOfficerMobile": "7048980163",
    "supportingOfficers": [
      {"name": "हे0का0 1395 सुमित कुमार थाना को0देहात", "mobile": "8630641512"},
      {"name": "हो0गा0 541 चित्रकुमार थाना को0देहात", "mobile": "8630641512"}
    ],
    "dutyPlace": "मामन तिराहा",
    "thanaArea": "कोतवाली देहात",
    "dutyTime": "सुबह 08:00 बजे से रात्रि 20:00 बजे तक",
    "zonalMagistrate": "",
    "zonalPoliceOfficer": "",
    "sectorMagistrate": "",
    "sectorPoliceOfficer": ""
  }]
}

Extract every single record present in the image. Do not summarize or skip any rows.`,
          mediaType,
          base64Image
        },
        modelName
      );
      
      // Clean response text to extract JSON block if wrapped in markdown
      let jsonText = responseText.trim();
      const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        jsonText = markdownMatch[1];
      }

      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.eventName) eventName = parsed.eventName;
        if (parsed.district) district = parsed.district;
        if (parsed.dutyDateFrom) dutyDateFrom = parsed.dutyDateFrom;
        if (parsed.dutyDateTo) dutyDateTo = parsed.dutyDateTo;

        if (parsed.records && Array.isArray(parsed.records)) {
          allRecords.push(...parsed.records);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON for file:', file.name, parseError);
        console.log('Raw response was:', responseText);
      }
    }

    // Attach local UUIDs to each record for react key and local editing identification
    const recordsWithIds = allRecords.map((rec: any, idx: number) => ({
      ...rec,
      id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    return NextResponse.json({
      eventName,
      district,
      dutyDateFrom,
      dutyDateTo,
      records: recordsWithIds,
    });
  } catch (error: any) {
    console.error('Error during vision extraction:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during extraction.' },
      { status: 500 }
    );
  }
}
