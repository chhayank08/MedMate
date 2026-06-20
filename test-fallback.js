/**
 * Test script to verify OpenRouter fallback when Gemini limits are exhausted.
 * Run: node test-fallback.js
 */

const SUPABASE_URL = 'https://lynzowvrmzhevoshdfjr.supabase.co';

async function testSummaryFallback() {
  console.log('🧪 Testing AI provider fallback...\n');
  
  // Get auth token
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': 'YOUR_ANON_KEY' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    })
  });

  if (!authResponse.ok) {
    console.error('❌ Authentication failed. Update credentials in script.');
    return;
  }

  const { access_token } = await authResponse.json();
  console.log('✅ Authenticated\n');

  // Test summary endpoint multiple times to exhaust Gemini
  for (let i = 1; i <= 15; i++) {
    console.log(`Request ${i}:`);
    const start = Date.now();
    
    const response = await fetch('http://localhost:3000/api/ai/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        type: 'quick_summary',
        subject: 'Anatomy',
        sourceText: 'The heart is a muscular organ that pumps blood through the circulatory system.'
      })
    });

    const elapsed = Date.now() - start;
    
    if (response.ok) {
      console.log(`  ✅ Status ${response.status} (${elapsed}ms)`);
      if (response.headers.get('content-type')?.includes('text/plain')) {
        const text = await response.text();
        console.log(`  📄 Response preview: ${text.slice(0, 100)}...`);
      }
    } else {
      const error = await response.json();
      console.log(`  ❌ Status ${response.status} (${elapsed}ms)`);
      console.log(`  💬 Error: ${error.error}`);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        console.log(`  ⏱️  Retry after: ${retryAfter}s`);
      }
    }
    console.log();
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }
}

console.log('⚠️  INSTRUCTIONS:');
console.log('1. Update YOUR_ANON_KEY with your Supabase anon key');
console.log('2. Update email/password with valid test credentials');
console.log('3. Ensure dev server is running: npm run dev');
console.log('4. Run: node test-fallback.js\n');

// Uncomment to run:
// testSummaryFallback().catch(console.error);
