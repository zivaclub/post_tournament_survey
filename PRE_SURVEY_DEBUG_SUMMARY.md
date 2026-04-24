# Pre-Survey Data Fetching Issue - Debug & Fix Summary

## Problem Identified
Sumit Kumar (Test) had pre-survey data for questions 1-7, but the analytics showed a pre-tournament WEMWBS-7 score of 0, indicating the pre-survey data wasn't being correctly processed.

## Root Cause Analysis
Through comprehensive logging, I discovered the issue was a **data structure mismatch**:

### Pre-Survey API Data Structure
```javascript
// Returned by /api/pre-survey
{
  name: "Sumit Kumar (Test)",
  answers: {
    q1: 3, q2: 4, q3: 2, q4: 3, q5: 4, q6: 3, q7: 4  // String keys
  }
}
```

### Post-Survey Data Structure
```javascript
// Used in analytics calculations
{
  1: 4, 2: 3, 3: 4, 4: 3, 5: 4, 6: 3, 7: 4,  // Numeric keys
  8: 7, 9: 3, 10: 4, 11: 4, 12: 4, 13: 2, 14: 4,
  15: 8, 17: "Yes", 18: "Yes"
}
```

### The Issue
- **Pre-survey answers** used string keys: `q1`, `q2`, `q3`, etc.
- **Analytics functions** expected numeric keys: `1`, `2`, `3`, etc.
- **Result**: All pre-survey values returned `undefined`, leading to raw score of 0

## Solution Implemented

### 1. Enhanced Analytics Functions
Updated all WEMWBS-7 and index calculation functions to handle both key formats:

```typescript
// Before: Only numeric keys
const value = answers[id];

// After: Both numeric and string keys
let value = answers[id]; // Try numeric key (1)
if (value === undefined) {
  value = answers[`q${id}`]; // Try string key (q1)
}
```

### 2. Updated Functions
- `calculateWEMWBS7()` - Handles both `1` and `q1` key formats
- `calculatePhysicalIndex()` - Supports mixed key formats for pre/post data
- `calculateSocialIndex()` - Supports mixed key formats for pre/post data
- `calculateAnalytics()` - Added comprehensive logging

### 3. Comprehensive Debug Logging
Added detailed logging at every stage:
- **Pre-survey API**: Shows data structure and keys
- **Data matching**: Logs player name matching process
- **Submission**: Shows selectedPre value and type
- **Analytics**: Detailed calculation step-by-step
- **WEMWBS7**: Shows which keys are found and their values

## Validation Results

### Test Case: Sumit Kumar (Test)
```javascript
// Pre-survey data (q1-q7 format): [3,4,2,3,4,3,4]
Raw Score: 23 → Standardized: 57 (Healthy)

// Post-survey data (1-7 format): [4,3,4,3,4,3,4]  
Raw Score: 25 → Standardized: 64 (Healthy)

// Mental Growth: 64 - 57 = 7 (Moderate Improvement)
```

### Before Fix
- Pre WEMWBS-7: 0 (incorrect)
- Mental Growth: Incorrect calculation

### After Fix
- Pre WEMWBS-7: 57 (correct)
- Mental Growth: 7 (correct)

## Files Modified

1. **`src/analytics.ts`**
   - Updated `calculateWEMWBS7()` to handle both key formats
   - Updated `calculatePhysicalIndex()` and `calculateSocialIndex()`
   - Enhanced type signatures to support both formats
   - Added comprehensive debug logging

2. **`src/App.tsx`**
   - Added detailed logging in `computeReport()`
   - Added submission debugging logs
   - Enhanced pre-survey data tracking

3. **`api/pre-survey.ts`**
   - Added logging to show returned data structure
   - Enhanced debugging for data format verification

## Impact
✅ **Pre-survey data now correctly processed** for all players
✅ **Accurate mental growth calculations** using proper pre/post comparison
✅ **Backward compatibility** maintained for existing post-survey format
✅ **Enhanced debugging** capabilities for future troubleshooting
✅ **All analytics indices** now work with mixed data formats

The analytics module now correctly handles the data structure mismatch and provides accurate tournament impact assessments for all players.
