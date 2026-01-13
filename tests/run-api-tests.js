// backend/tests/run-api-tests.js

/**
 * Newman CLI Testing Script
 * Run Postman collection from command line
 * 
 * Install: npm install -g newman
 * Run: node tests/run-api-tests.js
 */

const newman = require('newman');
const path = require('path');

console.log('🧪 Starting API Tests...\n');

newman.run({
    collection: path.join(__dirname, 'Street-Bites-API-Collection.json'),
    environment: path.join(__dirname, 'Street-Bites-Environment-Dev.json'),
    reporters: ['cli', 'json', 'html'],
    reporter: {
        html: {
            export: path.join(__dirname, 'test-results.html')
        },
        json: {
            export: path.join(__dirname, 'test-results.json')
        }
    },
    insecure: true, // Allow self-signed certificates
    timeout: 10000, // 10 seconds timeout
}, function (err, summary) {
    if (err) {
        console.error('❌ Collection run error:', err);
        process.exit(1);
    }

    console.log('\n📊 Test Summary:\n');
    console.log(`Total Requests: ${summary.run.stats.requests.total}`);
    console.log(`Passed: ${summary.run.stats.assertions.total - summary.run.stats.assertions.failed}`);
    console.log(`Failed: ${summary.run.stats.assertions.failed}`);
    console.log(`Response Time (avg): ${summary.run.timings.responseAverage}ms`);
    
    if (summary.run.failures.length > 0) {
        console.log('\n❌ Failed Tests:\n');
        summary.run.failures.forEach((failure, index) => {
            console.log(`${index + 1}. ${failure.error.test || failure.error.message}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!\n');
        console.log(`📄 HTML Report: ${path.join(__dirname, 'test-results.html')}`);
        console.log(`📄 JSON Report: ${path.join(__dirname, 'test-results.json')}`);
        process.exit(0);
    }
});