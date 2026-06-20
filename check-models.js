#!/usr/bin/env node

/**
 * Check available Gemini models and their limits
 * Usage: GEMINI_API_KEY=your_key node check-models.js
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY environment variable is required');
  console.error('Usage: GEMINI_API_KEY=your_key node check-models.js');
  process.exit(1);
}

async function checkModels() {
  console.log('🔍 Checking available Gemini models...\n');
  
  const testModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-2.0-flash-exp',
    'gemini-exp-1206',
  ];

  for (const model of testModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
        })
      });

      if (res.ok) {
        console.log(`✅ ${model} - Available`);
      } else {
        const error = await res.text();
        console.log(`❌ ${model} - ${res.status}: ${error.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`💥 ${model} - Error: ${err.message}`);
    }
  }
}

checkModels();
