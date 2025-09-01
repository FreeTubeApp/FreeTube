# 🧪 Manual Testing Checklist for Random Search Feature

## ✅ Pre-Testing Setup
- [ ] FreeTube development server is running (`npm run dev`)
- [ ] Both Invidious and Local backends are accessible
- [ ] Test with different network conditions (fast/slow)

## 🔍 Core Functionality Tests

### Test 1: Basic Random Search
- [ ] **Query**: "game grumps"
- [ ] **Steps**:
  1. Open search filters
  2. Select "Random" from sort dropdown
  3. Execute search
  4. Verify results are different from "Most Relevant"
- [ ] **Expected**: Results should be randomized, not in relevance order
- [ ] **Notes**: Compare with "Most Relevant" sort to confirm difference

### Test 2: Multiple Searches Same Query
- [ ] **Query**: "minecraft"
- [ ] **Steps**:
  1. Search with "Random" sort
  2. Note first 5 results
  3. Search again with "Random" sort
  4. Compare first 5 results
- [ ] **Expected**: Results should be different between searches
- [ ] **Notes**: This tests true randomization

### Test 3: Different Query Types
- [ ] **Queries to test**:
  - Short: "cat"
  - Medium: "programming tutorial"
  - Long: "how to build a complete web application from scratch"
  - Special chars: "C++ programming"
  - Numbers: "2024 review"
- [ ] **Expected**: All should work with random sort
- [ ] **Notes**: Check for any query-specific issues

### Test 4: Backend Comparison
- [ ] **Test both backends**:
  1. Switch to Invidious backend
  2. Test random search
  3. Switch to Local backend
  4. Test same query with random search
- [ ] **Expected**: Both should work, may have different result counts
- [ ] **Notes**: Local backend might have more comprehensive results

## ⚡ Performance Tests

### Test 5: Response Time
- [ ] **Measure time for**:
  - Normal search (Most Relevant): _____ seconds
  - Random search: _____ seconds
- [ ] **Expected**: Random search should be reasonable (within 2-3x normal)
- [ ] **Notes**: Random search fetches multiple pages, so will be slower

### Test 6: Large Result Sets
- [ ] **Query**: "music" (high volume query)
- [ ] **Expected**: Should handle large result sets without crashing
- [ ] **Notes**: Check for memory usage and UI responsiveness

### Test 7: Network Issues
- [ ] **Simulate slow network** (use browser dev tools)
- [ ] **Expected**: Should handle timeouts gracefully
- [ ] **Notes**: Check error messages and fallback behavior

## 🎯 Edge Cases

### Test 8: Empty Results
- [ ] **Query**: "xyz123nonexistentquery"
- [ ] **Expected**: Should handle gracefully, no crashes
- [ ] **Notes**: Check error handling

### Test 9: Very Specific Queries
- [ ] **Query**: "exact video title that exists"
- [ ] **Expected**: Should still randomize results
- [ ] **Notes**: Even specific queries should be randomized

### Test 10: Filter Combinations
- [ ] **Test random sort with**:
  - Time filters (Today, This Week, etc.)
  - Duration filters (Short, Medium, Long)
  - Type filters (Videos, Channels, Playlists)
  - Feature filters (HD, Subtitles, etc.)
- [ ] **Expected**: All combinations should work
- [ ] **Notes**: Check for filter conflicts

## 🔄 UI/UX Tests

### Test 11: Filter Persistence
- [ ] **Steps**:
  1. Set random sort
  2. Navigate away from search
  3. Return to search
- [ ] **Expected**: Random sort should be remembered
- [ ] **Notes**: Check if filter state persists

### Test 12: Clear Filters
- [ ] **Steps**:
  1. Set random sort
  2. Click "Clear Filters"
- [ ] **Expected**: Should reset to "Most Relevant"
- [ ] **Notes**: Verify default behavior

### Test 13: Loading States
- [ ] **Expected**: Should show loading indicator during random search
- [ ] **Notes**: Random search takes longer, UI should reflect this

## 📊 Data Quality Tests

### Test 14: Result Diversity
- [ ] **Query**: "tutorial"
- [ ] **Check for**:
  - Mix of old and new videos
  - Different channels
  - Various view counts
  - Different durations
- [ ] **Expected**: Should see diverse results, not just popular ones
- [ ] **Notes**: This is the main benefit of random search

### Test 15: Duplicate Detection
- [ ] **Expected**: No duplicate videos in results
- [ ] **Notes**: Check if deduplication works properly

### Test 16: Result Count
- [ ] **Compare result counts**:
  - Normal search: _____ results
  - Random search: _____ results
- [ ] **Expected**: Random search should have more results (multi-page)
- [ ] **Notes**: Should be significantly more than single page

## 🐛 Bug Hunting

### Test 17: Rapid Searches
- [ ] **Steps**:
  1. Start random search
  2. Quickly start another search
  3. Repeat multiple times
- [ ] **Expected**: Should handle rapid requests without errors
- [ ] **Notes**: Check for race conditions

### Test 18: Browser Refresh
- [ ] **Steps**:
  1. Start random search
  2. Refresh browser during search
- [ ] **Expected**: Should handle gracefully
- [ ] **Notes**: Check for state corruption

### Test 19: Memory Leaks
- [ ] **Steps**:
  1. Perform multiple random searches
  2. Monitor memory usage
- [ ] **Expected**: No significant memory increase
- [ ] **Notes**: Check for memory leaks in result handling

## 📝 Test Results Template

```
Test Date: _____
Tester: _____
FreeTube Version: _____
Backend Used: _____ (Invidious/Local)

Test Results:
- [ ] All core functionality tests passed
- [ ] Performance is acceptable
- [ ] Edge cases handled properly
- [ ] UI/UX is smooth
- [ ] No bugs found

Issues Found:
1. _____
2. _____
3. _____

Recommendations:
1. _____
2. _____
3. _____

Overall Assessment: _____ (Ready for PR / Needs fixes / Major issues)
```

## 🚨 Critical Issues to Watch For

- [ ] **Crashes**: Any application crashes during random search
- [ ] **Infinite Loading**: Search never completes
- [ ] **Wrong Results**: Results don't match query
- [ ] **Performance**: Unacceptable response times (>10 seconds)
- [ ] **Memory**: Excessive memory usage
- [ ] **UI Freeze**: Interface becomes unresponsive

## 🎯 Success Criteria

The random search feature is ready for PR if:
- [ ] All core functionality tests pass
- [ ] Performance is within acceptable limits
- [ ] No critical bugs found
- [ ] Results are actually randomized
- [ ] Both backends work properly
- [ ] UI remains responsive
