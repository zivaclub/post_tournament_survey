// Simple test to validate analytics calculations
// Copy this code into browser console on the app to test

// Test data
const testPostAnswers = {
  1: 4, 2: 3, 3: 4, 4: 3, 5: 4, 6: 3, 7: 4, // WEMWBS-7 questions
  8: 7, 9: 3, 10: 4, // Confidence questions
  11: 4, 12: 4, // Physical questions
  13: 2, 14: 4, // Social questions
  15: 8, 16: "Great tournament experience",
  17: "Yes", 18: "Yes"
};

const testPreAnswers = {
  1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, // WEMWBS-7 pre
  9: 2, 10: 2, 11: 2, 12: 2 // Physical pre questions
};

// Manual calculation validation
console.log("=== Manual Calculation Test ===");

// WEMWBS-7 Pre
const preRaw = [1,2,3,4,5,6,7].reduce((sum, id) => sum + (testPreAnswers[id] || 0), 0);
const preStandardized = Math.round(((preRaw - 7) / 28) * 100);
console.log("Pre WEMWBS-7 - Raw:", preRaw, "Standardized:", preStandardized);

// WEMWBS-7 Post
const postRaw = [1,2,3,4,5,6,7].reduce((sum, id) => sum + testPostAnswers[id], 0);
const postStandardized = Math.round(((postRaw - 7) / 28) * 100);
console.log("Post WEMWBS-7 - Raw:", postRaw, "Standardized:", postStandardized);

// Mental Growth
const mentalGrowth = postStandardized - preStandardized;
console.log("Mental Growth:", mentalGrowth);

// Confidence Index
const norm10 = (x) => ((x - 1) / 9) * 100;
const norm4 = (x) => ((x - 1) / 3) * 100;
const norm5 = (x) => ((x - 1) / 4) * 100;
const confidenceIndex = Math.round((norm10(testPostAnswers[8]) + norm4(testPostAnswers[9]) + norm5(testPostAnswers[10])) / 3);
console.log("Confidence Index:", confidenceIndex);

// Physical Index
const physicalIndex = Math.round((
  norm5(testPreAnswers[9]) + norm5(testPreAnswers[10]) + norm5(testPreAnswers[11]) +
  norm5(testPostAnswers[11]) + norm5(testPostAnswers[12])
) / 5);
console.log("Physical Index:", physicalIndex);

// Social Index
const socialIndex = Math.round((
  norm5(testPreAnswers[12]) + ((testPostAnswers[13] - 1) / 2) * 100 + norm5(testPostAnswers[14])
) / 3);
console.log("Social Index:", socialIndex);

// Retention Index
const retentionIndex = Math.round(((testPostAnswers[17] === "Yes" ? 100 : testPostAnswers[17] === "Maybe" ? 50 : 0) + 
                                   (testPostAnswers[18] === "Yes" ? 100 : testPostAnswers[18] === "Maybe" ? 50 : 0)) / 2);
console.log("Retention Index:", retentionIndex);

// Tournament Impact Score
const tournamentImpactScore = Math.round(
  0.35 * postStandardized +
  0.25 * confidenceIndex +
  0.15 * physicalIndex +
  0.15 * socialIndex +
  0.10 * retentionIndex
);
console.log("Tournament Impact Score:", tournamentImpactScore);

console.log("\n=== Expected Results for App ===");
console.log("Pre WEMWBS-7:", preStandardized);
console.log("Post WEMWBS-7:", postStandardized);
console.log("Mental Growth:", mentalGrowth);
console.log("Confidence Index:", confidenceIndex);
console.log("Physical Index:", physicalIndex);
console.log("Social Index:", socialIndex);
console.log("Retention Index:", retentionIndex);
console.log("Tournament Impact Score:", tournamentImpactScore);
