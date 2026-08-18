import assert from 'node:assert';
import { extractPreferences, explainRoute } from '../src/utils/geminiClient.js';

console.log('🤖 Running Gemini AI Layer Unit Tests...\n');

async function runTests() {
  // Test 1: Sample Input 1
  const input1 = "I can't use stairs and I need to get to Guindy.";
  const res1 = await extractPreferences(input1);
  console.log(`[Test 1] Input: "${input1}"`);
  console.log('Result:', JSON.stringify(res1));
  assert.strictEqual(res1.destination, 'Guindy');
  assert.strictEqual(res1.avoidStairs, true);
  assert.strictEqual(res1.wheelchair, false);
  console.log('✅ Test 1 Passed!\n');

  // Test 2: Sample Input 2
  const input2 = "I'm in a wheelchair and want to go to Guindy without stairs.";
  const res2 = await extractPreferences(input2);
  console.log(`[Test 2] Input: "${input2}"`);
  console.log('Result:', JSON.stringify(res2));
  assert.strictEqual(res2.destination, 'Guindy');
  assert.strictEqual(res2.wheelchair, true);
  assert.strictEqual(res2.avoidStairs, true);
  console.log('✅ Test 2 Passed!\n');

  // Test 3: Sample Input 3
  const input3 = "Get me to Guindy. I can't walk far.";
  const res3 = await extractPreferences(input3);
  console.log(`[Test 3] Input: "${input3}"`);
  console.log('Result:', JSON.stringify(res3));
  assert.strictEqual(res3.destination, 'Guindy');
  assert.strictEqual(res3.minimizeWalking, true);
  console.log('✅ Test 3 Passed!\n');

  // Test 4: Voice navigation input
  const input4 = "Take me to Chennai Central with voice navigation.";
  const res4 = await extractPreferences(input4);
  console.log(`[Test 4] Input: "${input4}"`);
  console.log('Result:', JSON.stringify(res4));
  assert.strictEqual(res4.destination, 'Chennai Central');
  assert.strictEqual(res4.voiceGuidance, true);
  console.log('✅ Test 4 Passed!\n');

  // Test 5: Route Explanation Generator
  const mockRoute = {
    durationText: '38 min',
    fare: 25,
    isStepFree: true,
    segments: [
      { mode: 'Bus 21', badge: 'MTC Bus 21', type: 'bus', description: 'Low-floor, Ramp' },
      { mode: 'Chennai Metro', badge: 'Chennai Metro', type: 'metro', description: 'Step-free to platform' }
    ],
    accessibilityLevel: 'Elevator access is available at the transfer and no stairs are required'
  };
  const explanation = await explainRoute(mockRoute);
  console.log('[Test 5] Route explanation:', explanation);
  assert.ok(explanation && explanation.length > 10, 'Explanation should be non-empty string');
  console.log('✅ Test 5 Passed!\n');

  console.log('🎉 All Gemini AI Layer tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ AI Test Failed:', err);
  process.exit(1);
});
