const { GoogleGenerativeAI } = require('@google/generative-ai');

const fs = require('fs');
const path = require('path');

// Load .env.local if process.env.GEMINI_API_KEY is not set
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (match) {
        process.env.GEMINI_API_KEY = match[1].trim();
      }
    }
  } catch (e) {
    console.error('Error reading .env.local:', e);
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  console.log('Testing with API key:', apiKey ? apiKey.substring(0, 8) + '...' : 'none');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
    
    // Load up_police_logo.png
    const imagePath = path.join(__dirname, 'public', 'up_police_logo.png');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Test image not found at ${imagePath}`);
    }
    
    const buffer = fs.readFileSync(imagePath);
    const base64Image = buffer.toString('base64');
    
    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: base64Image
                }
              },
              { text: 'Describe what this logo is in 5 words or less.' }
            ]
          }]
        });
        console.log(`Success with ${modelName}:`, result.response.text().trim());
      } catch (err) {
        console.error(`Error with ${modelName}:`, err.message);
      }
    }
  } catch (error) {
    console.error('General error:', error);
  }
}

main();
