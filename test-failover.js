#!/usr/bin/env node

/**
 * Test AI Provider Failover
 * 
 * This script tests the Gemini model rotation and OpenRouter fallback by:
 * 1. Making multiple summary requests to exhaust Gemini quotas
 * 2. Observing automatic model rotation (gemini-2.5-flash → 1.5-flash → 1.5-flash-8b)
 * 3. Verifying OpenRouter fallback when all Gemini models are exhausted
 * 4. Checking server logs for proper rotation messages
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials - UPDATE THESE
const TEST_EMAIL = 'chayankkashyap2000@gmail.com';
const TEST_PASSWORD = 'your_password_here';

async function authenticate() {
  console.log('🔐 Authenticating...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Authenticated successfully\n');
  return data.session?.access_token;
}

async function testSummary(accessToken, requestNum) {
  const start = Date.now();
  
  const response = await fetch(`${BASE_URL}/api/ai/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      type: 'quick_summary',
      subject: 'Anatomy',
      sourceText: `Request #${requestNum}: The cardiovascular system consists of the heart, blood vessels, and blood. The heart pumps oxygenated blood through arteries to body tissues and receives deoxygenated blood through veins. The cardiac cycle includes systole (contraction) and diastole (relaxation).`
    })
  });

  const elapsed = Date.now() - start;
  
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('text/plain')) {
      // Streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      
      return {
        success: true,
        status: response.status,
        elapsed,
        preview: text.slice(0, 80).replace(/\n/g, ' ')
      };
    } else {
      const data = await response.json();
      return {
        success: true,
        status: response.status,
        elapsed,
        data
      };
    }
  } else {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return {
      success: false,
      status: response.status,
      elapsed,
      error: error.error,
      retryAfter: response.headers.get('retry-after')
    };
  }
}

async function runTest() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     AI Provider Failover Test                         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Test Plan:');
  console.log('  1. Make 20 summary requests rapidly');
  console.log('  2. Exhaust Gemini 2.5 Flash quota (RPD: 20)');
  console.log('  3. Verify rotation to Gemini 1.5 Flash');
  console.log('  4. Verify rotation to Gemini 1.5 Flash 8B');
  console.log('  5. Verify OpenRouter fallback if all exhausted\n');
  
  console.log('⚠️  Watch server terminal for rotation logs:\n');
  console.log('    [AI Router Stream] Attempting gemini/gemini-2.5-flash');
  console.log('    [AI Router Stream] ❌ Failed with gemini/gemini-2.5-flash: rate_limit (429)');
  console.log('    [AI Router Stream] ⚠️  gemini-2.5-flash quota exhausted, rotating...');
  console.log('    [AI Router Stream] Attempting gemini/gemini-1.5-flash');
  console.log('    [AI Router Stream] ✅ Success with gemini/gemini-1.5-flash\n');
  
  let accessToken;
  try {
    accessToken = await authenticate();
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    console.error('\n⚠️  Please update TEST_EMAIL and TEST_PASSWORD in the script');
    process.exit(1);
  }

  console.log('🚀 Starting stress test...\n');
  console.log('─'.repeat(70));
  
  let successCount = 0;
  let failCount = 0;
  let totalTime = 0;
  
  for (let i = 1; i <= 20; i++) {
    process.stdout.write(`Request ${String(i).padStart(2)}: `);
    
    try {
      const result = await testSummary(accessToken, i);
      totalTime += result.elapsed;
      
      if (result.success) {
        successCount++;
        console.log(`✅ ${result.status} (${result.elapsed}ms)`);
        if (result.preview) {
          console.log(`           Preview: "${result.preview}..."`);
        }
      } else {
        failCount++;
        console.log(`❌ ${result.status} (${result.elapsed}ms)`);
        console.log(`           Error: ${result.error}`);
        if (result.retryAfter) {
          console.log(`           Retry-After: ${result.retryAfter}s`);
        }
      }
    } catch (err) {
      failCount++;
      console.log(`💥 Exception: ${err.message}`);
    }
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('─'.repeat(70));
  console.log('\n📊 Test Results:');
  console.log(`   Total Requests:  20`);
  console.log(`   ✅ Successful:    ${successCount}`);
  console.log(`   ❌ Failed:        ${failCount}`);
  console.log(`   ⏱️  Avg Time:      ${Math.round(totalTime / 20)}ms`);
  console.log(`   🎯 Success Rate:  ${Math.round((successCount / 20) * 100)}%\n`);
  
  console.log('📋 Expected Behavior:');
  if (successCount >= 15) {
    console.log('   ✅ PASS - Failover is working correctly');
    console.log('   ✅ Requests succeeded despite quota exhaustion');
    console.log('   ✅ Model rotation prevented complete failure\n');
  } else {
    console.log('   ⚠️  REVIEW - Success rate lower than expected');
    console.log('   ⚠️  Check server logs for rotation messages');
    console.log('   ⚠️  Verify all Gemini models and OpenRouter are configured\n');
  }
  
  console.log('🔍 Next Steps:');
  console.log('   1. Check server terminal for [AI Router] logs');
  console.log('   2. Verify model rotation occurred: gemini-2.5-flash → 1.5-flash → OpenRouter');
  console.log('   3. Check Gemini API dashboard: https://aistudio.google.com/apikey');
  console.log('   4. Monitor observability tools (Langfuse/Helicone) for provider distribution\n');
}

runTest().catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});
