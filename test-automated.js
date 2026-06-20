#!/usr/bin/env node

/**
 * Automated AI Failover Test
 * Tests Gemini model rotation by making authenticated API calls
 */

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://lynzowvrmzhevoshdfjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OanqFd9m6gbnMBzcndaB3A_3HxSorCJ';

// You need to set your test credentials
const EMAIL = process.env.TEST_EMAIL || 'your-email@example.com';
const PASSWORD = process.env.TEST_PASSWORD || 'your-password';

async function signIn() {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function makeRequest(token, num) {
  const start = Date.now();
  
  const response = await fetch(`${BASE_URL}/api/ai/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'quick_summary',
      subject: 'Anatomy',
      sourceText: `Test ${num}: The heart has four chambers - two atria and two ventricles. Blood flows from the right atrium to right ventricle to lungs, then from lungs to left atrium to left ventricle to body.`
    })
  });

  const elapsed = Date.now() - start;
  
  if (response.ok) {
    // Read stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      
      return {
        ok: true,
        status: response.status,
        elapsed,
        length: text.length,
        preview: text.slice(0, 60).replace(/\n/g, ' ')
      };
    } catch (err) {
      return {
        ok: false,
        status: response.status,
        elapsed,
        error: 'Stream error: ' + err.message
      };
    }
  } else {
    const error = await response.json().catch(() => ({}));
    return {
      ok: false,
      status: response.status,
      elapsed,
      error: error.error || 'Unknown error',
      retryAfter: response.headers.get('retry-after')
    };
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║     Automated AI Failover Test                        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  if (EMAIL === 'your-email@example.com') {
    console.log('⚠️  Please set credentials:\n');
    console.log('   export TEST_EMAIL="your-email@example.com"');
    console.log('   export TEST_PASSWORD="your-password"');
    console.log('   node test-automated.js\n');
    console.log('OR run the manual test:');
    console.log('   node test-manual.js\n');
    process.exit(1);
  }

  console.log('🔐 Authenticating...');
  let token;
  try {
    token = await signIn();
    console.log('✅ Authenticated\n');
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    process.exit(1);
  }

  console.log('🚀 Making 25 summary requests...');
  console.log('📊 Watch for model rotation in server logs\n');
  console.log('─'.repeat(70));

  let stats = { success: 0, failed: 0, totalTime: 0 };

  for (let i = 1; i <= 25; i++) {
    process.stdout.write(`[${String(i).padStart(2)}] `);
    
    const result = await makeRequest(token, i);
    stats.totalTime += result.elapsed;

    if (result.ok) {
      stats.success++;
      console.log(`✅ ${result.status} ${result.elapsed}ms - ${result.length} chars`);
    } else {
      stats.failed++;
      console.log(`❌ ${result.status} ${result.elapsed}ms - ${result.error}`);
      if (result.retryAfter) {
        console.log(`    Retry-After: ${result.retryAfter}s`);
      }
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log('─'.repeat(70));
  console.log('\n📊 Results:');
  console.log(`   Requests:     25`);
  console.log(`   ✅ Success:    ${stats.success} (${Math.round(stats.success/25*100)}%)`);
  console.log(`   ❌ Failed:     ${stats.failed} (${Math.round(stats.failed/25*100)}%)`);
  console.log(`   ⏱️  Avg Time:   ${Math.round(stats.totalTime/25)}ms\n`);

  if (stats.success >= 20) {
    console.log('✅ PASS - Failover working correctly');
    console.log('   Model rotation prevented failures\n');
  } else if (stats.success >= 15) {
    console.log('⚠️  PARTIAL - Some failures occurred');
    console.log('   Check server logs for rotation issues\n');
  } else {
    console.log('❌ FAIL - Too many failures');
    console.log('   Model rotation may not be working\n');
  }

  console.log('🔍 Check server logs for:');
  console.log('   [AI Router] Resolved candidates');
  console.log('   [AI Router Stream] ⚠️  quota exhausted, rotating...\n');
}

main().catch(err => {
  console.error('\n💥 Error:', err.message);
  process.exit(1);
});
