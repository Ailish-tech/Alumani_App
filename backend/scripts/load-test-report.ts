import fs from 'fs';

function generateReport() {
  const data = JSON.parse(fs.readFileSync('load-test-results.json', 'utf8'));

  const metrics = data.aggregate.summaries;
  const rates = data.aggregate.rates;
  const counters = data.aggregate.counters;

  const p95 = metrics['http.response_time'].p95;
  const p99 = metrics['http.response_time'].p99;
  const median = metrics['http.response_time'].median;
  
  const totalRequests = counters['http.requests'] || 0;
  const successfulRequests = counters['http.codes.200'] || 0;
  const rateLimitErrors = counters['http.codes.429'] || 0;
  const serverErrors = counters['http.codes.500'] || 0;

  const errorRate = ((totalRequests - successfulRequests) / totalRequests) * 100;
  const rps = rates['http.request_rate'];

  console.log('\n======================================================');
  console.log('                 LOAD TEST RESULTS');
  console.log('======================================================\n');
  
  console.log(`⏱️  Latency (Target: p95 < 100ms, p99 < 200ms)`);
  console.log(`   - Median (p50): ${median} ms`);
  console.log(`   - p95:          ${p95} ms   ${p95 < 100 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - p99:          ${p99} ms   ${p99 < 200 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`\n📈 Throughput (Target: Sustained ~16.6 req/sec = 1K/min)`);
  console.log(`   - Total Requests: ${totalRequests}`);
  console.log(`   - Avg Req/Sec:    ${rps} req/s`);
  
  console.log(`\n🛑 Reliability (Target: Error Rate < 1%)`);
  console.log(`   - Success (200s): ${successfulRequests}`);
  console.log(`   - Rate Limits:    ${rateLimitErrors} (429s)`);
  console.log(`   - Server Errors:  ${serverErrors} (500s)`);
  console.log(`   - Error Rate:     ${errorRate.toFixed(2)}%   ${errorRate < 1 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n======================================================\n');
}

generateReport();
