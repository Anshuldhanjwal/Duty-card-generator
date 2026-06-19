import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Initialize Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
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

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mediaType,
                  data: base64Image
                }
              },
              {
                text: `You extract Hindi police duty chart data from the provided image.
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

Extract every single record present in the image. Do not summarize or skip any rows.`
              }
            ]
          }
        ]
      });

      const responseText = response.response.text ? response.response.text() : '';
      
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
