// Test script to debug pre-survey data handling
// This simulates the actual data structure from the API

console.log("=== TESTING PRE-SURVEY DATA HANDLING ===");

// Simulate pre-survey data as returned by API (with q1, q2, etc. keys)
const mockPreSurveyData = {
  name: "Sumit Kumar (Test)",
  answers: {
    q1: 3,
    q2: 4,
    q3: 2,
    q4: 3,
    q5: 4,
    q6: 3,
    q7: 4
  }
};

// Simulate post-survey data (with numeric keys 1, 2, etc.)
const mockPostAnswers = {
  1: 4, 2: 3, 3: 4, 4: 3, 5: 4, 6: 3, 7: 4,
  8: 7, 9: 3, 10: 4, 11: 4, 12: 4, 13: 2, 14: 4,
  15: 8, 17: "Yes", 18: "Yes"
};

console.log("Mock pre-survey data:", JSON.stringify(mockPreSurveyData, null, 2));
console.log("Mock post-survey answers:", JSON.stringify(mockPostAnswers, null, 2));

// Test the WEMWBS7 calculation with both formats
const testWEMWBS7 = (answers, label) => {
  console.log(`\n=== Testing ${label} ===`);
  console.log("Answers keys:", Object.keys(answers));
  
  const rawScore = [1, 2, 3, 4, 5, 6, 7].reduce((sum, id) => {
    // Try both numeric key (1) and string key (q1)
    let value = answers[id]; // numeric key
    if (value === undefined) {
      value = answers[`q${id}`]; // string key
    }
    
    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
    console.log(`  Q${id}: checked keys [${id}, 'q${id}'] -> found: ${value} -> ${numericValue}`);
    return sum + numericValue;
  }, 0);
  
  const standardizedScore = Math.round(((rawScore - 7) / 28) * 100);
  console.log("Raw score:", rawScore);
  console.log("Standardized score:", standardizedScore);
  
  return { rawScore, standardizedScore };
};

const preResult = testWEMWBS7(mockPreSurveyData.answers, "Pre-Survey (q1,q2,... format)");
const postResult = testWEMWBS7(mockPostAnswers, "Post-Survey (1,2,... format)");

console.log("\n=== COMPARISON ===");
console.log("Pre-survey:", preResult);
console.log("Post-survey:", postResult);
console.log("Mental growth:", postResult.standardizedScore - preResult.standardizedScore);

console.log("\n=== END TEST ===");
