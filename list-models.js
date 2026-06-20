#!/usr/bin/env node

/**
 * List available Gemini models
 * Usage: GEMINI_API_KEY=your_key node list-models.js
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable is required');
  console.error('Usage: GEMINI_API_KEY=your_key node list-models.js');
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  console.log('🤖 Available Gemini Models:\n');
  
  const models = data.models || [];
  const textModels = models
    .filter(m => 
      m.supportedGenerationMethods?.includes('generateContent') &&
      !m.name.includes('embedding') &&
      !m.name.includes('vision') &&
      !m.name.includes('imagen')
    )
    .map(m => ({
      name: m.name.replace('models/', ''),
      display: m.displayName,
      input: m.inputTokenLimit,
      output: m.outputTokenLimit
    }));
  
  textModels.forEach(m => {
    console.log(`✅ ${m.name}`);
    console.log(`   Display: ${m.display}`);
    console.log(`   Input: ${m.input?.toLocaleString()}, Output: ${m.output?.toLocaleString()}\n`);
  });
}

listModels().catch(console.error);
