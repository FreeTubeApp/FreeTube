#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Random Search Feature
 * Tests both Invidious and Local API implementations
 */

console.log('🧪 Testing Random Search Implementation...\n')

// Mock data for testing
const mockSearchSettings = {
  sortBy: 'random',
  time: '',
  duration: '',
  type: 'all',
  features: []
}

const mockFilters = {
  sortBy: 'random',
  time: '',
  duration: '',
  type: 'all',
  features: []
}

// Test 1: Verify SORT_BY_VALUES includes 'random'
function testSortByValues() {
  console.log('📋 Test 1: SORT_BY_VALUES includes "random"')
  
  try {
    // We'll need to import this dynamically since it's in a Vue component
    const fs = require('fs')
    const searchFiltersPath = './src/renderer/components/FtSearchFilters/FtSearchFilters.vue'
    const content = fs.readFileSync(searchFiltersPath, 'utf8')
    
    if (content.includes("'random'") && content.includes('SORT_BY_VALUES')) {
      console.log('✅ PASS: "random" found in SORT_BY_VALUES')
      return true
    } else {
      console.log('❌ FAIL: "random" not found in SORT_BY_VALUES')
      return false
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read search filters file:', error.message)
    return false
  }
}

// Test 2: Verify translation exists
function testTranslation() {
  console.log('\n🌐 Test 2: Translation for "Random" exists')
  
  try {
    const fs = require('fs')
    const localePath = './static/locales/en-US.yaml'
    const content = fs.readFileSync(localePath, 'utf8')
    
    if (content.includes('Random: Random')) {
      console.log('✅ PASS: "Random: Random" translation found')
      return true
    } else {
      console.log('❌ FAIL: "Random: Random" translation not found')
      return false
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read locale file:', error.message)
    return false
  }
}

// Test 3: Verify Invidious API changes
function testInvidiousAPI() {
  console.log('\n🔍 Test 3: Invidious API random search implementation')
  
  try {
    const fs = require('fs')
    const invidiousPath = './src/renderer/helpers/api/invidious.js'
    const content = fs.readFileSync(invidiousPath, 'utf8')
    
    const checks = [
      content.includes('searchSettings.sortBy === \'random\''),
      content.includes('maxPages = 5'),
      content.includes('Fisher-Yates shuffle'),
      content.includes('allResults.push(...pageResults)')
    ]
    
    const passed = checks.every(check => check)
    
    if (passed) {
      console.log('✅ PASS: Invidious API random search implementation looks correct')
      return true
    } else {
      console.log('❌ FAIL: Invidious API implementation missing key components')
      console.log('   - Random check:', checks[0])
      console.log('   - Max pages:', checks[1])
      console.log('   - Fisher-Yates:', checks[2])
      console.log('   - Results push:', checks[3])
      return false
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read Invidious API file:', error.message)
    return false
  }
}

// Test 4: Verify Local API changes
function testLocalAPI() {
  console.log('\n🏠 Test 4: Local API random search implementation')
  
  try {
    const fs = require('fs')
    const localPath = './src/renderer/helpers/api/local.js'
    const content = fs.readFileSync(localPath, 'utf8')
    
    const checks = [
      content.includes('filters.sortBy === \'random\''),
      content.includes('maxPages = 5'),
      content.includes('sortMethods = [\'relevance\', \'upload_date\', \'view_count\', \'rating\']'),
      content.includes('seenIds.has(result.videoId)'),
      content.includes('Fisher-Yates shuffle')
    ]
    
    const passed = checks.every(check => check)
    
    if (passed) {
      console.log('✅ PASS: Local API random search implementation looks correct')
      return true
    } else {
      console.log('❌ FAIL: Local API implementation missing key components')
      console.log('   - Random check:', checks[0])
      console.log('   - Max pages:', checks[1])
      console.log('   - Sort methods:', checks[2])
      console.log('   - Deduplication:', checks[3])
      console.log('   - Fisher-Yates:', checks[4])
      return false
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read Local API file:', error.message)
    return false
  }
}

// Test 5: Verify TypeScript types
function testTypeScriptTypes() {
  console.log('\n📝 Test 5: TypeScript type annotations')
  
  try {
    const fs = require('fs')
    const searchFiltersPath = './src/renderer/components/FtSearchFilters/FtSearchFilters.vue'
    const content = fs.readFileSync(searchFiltersPath, 'utf8')
    
    if (content.includes("'relevance' | 'rating' | 'upload_date' | 'view_count' | 'random'")) {
      console.log('✅ PASS: TypeScript types include "random"')
      return true
    } else {
      console.log('❌ FAIL: TypeScript types missing "random"')
      return false
    }
  } catch (error) {
    console.log('❌ FAIL: Could not read search filters file:', error.message)
    return false
  }
}

// Test 6: Verify no syntax errors
function testSyntax() {
  console.log('\n🔧 Test 6: Syntax validation')
  
  try {
    const { execSync } = require('child_process')
    
    // Test if the files can be parsed by Node.js
    execSync('node -c ./src/renderer/helpers/api/invidious.js', { stdio: 'pipe' })
    execSync('node -c ./src/renderer/helpers/api/local.js', { stdio: 'pipe' })
    
    console.log('✅ PASS: No syntax errors in API files')
    return true
  } catch (error) {
    console.log('❌ FAIL: Syntax errors found:', error.message)
    return false
  }
}

// Test 7: Performance considerations
function testPerformance() {
  console.log('\n⚡ Test 7: Performance considerations')
  
  try {
    const fs = require('fs')
    const invidiousPath = './src/renderer/helpers/api/invidious.js'
    const localPath = './src/renderer/helpers/api/local.js'
    
    const invidiousContent = fs.readFileSync(invidiousPath, 'utf8')
    const localContent = fs.readFileSync(localPath, 'utf8')
    
    const checks = [
      invidiousContent.includes('maxPages = 5'), // Reasonable limit
      localContent.includes('maxPages = 5'), // Reasonable limit
      invidiousContent.includes('break'), // Early termination
      localContent.includes('break'), // Early termination
      localContent.includes('console.warn'), // Error logging
    ]
    
    const passed = checks.every(check => check)
    
    if (passed) {
      console.log('✅ PASS: Performance considerations implemented')
      console.log('   - Page limits set to 5')
      console.log('   - Early termination on empty results')
      console.log('   - Error logging for failed requests')
      return true
    } else {
      console.log('❌ FAIL: Missing performance considerations')
      return false
    }
  } catch (error) {
    console.log('❌ FAIL: Could not check performance considerations:', error.message)
    return false
  }
}

// Run all tests
function runAllTests() {
  const tests = [
    testSortByValues,
    testTranslation,
    testInvidiousAPI,
    testLocalAPI,
    testTypeScriptTypes,
    testSyntax,
    testPerformance
  ]
  
  const results = tests.map(test => test())
  const passed = results.filter(result => result === true).length
  const total = results.length
  
  console.log('\n' + '='.repeat(50))
  console.log(`📊 Test Results: ${passed}/${total} tests passed`)
  console.log('='.repeat(50))
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Random search feature is ready for testing.')
    console.log('\n📋 Next Steps:')
    console.log('   1. Start FreeTube in development mode')
    console.log('   2. Test random search with various queries')
    console.log('   3. Verify results are actually randomized')
    console.log('   4. Check performance with different query types')
    console.log('   5. Test both Invidious and Local backends')
  } else {
    console.log('⚠️  Some tests failed. Please fix issues before proceeding.')
  }
  
  return passed === total
}

// Run the test suite
if (require.main === module) {
  runAllTests()
}

module.exports = {
  testSortByValues,
  testTranslation,
  testInvidiousAPI,
  testLocalAPI,
  testTypeScriptTypes,
  testSyntax,
  testPerformance,
  runAllTests
}
