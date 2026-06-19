const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  console.log('Testing with API key:', apiKey.substring(0, 8) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test gemini-3.5-flash and gemini-flash-latest
    const models = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
    
    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Write a 1-word greeting.' }] }]
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
