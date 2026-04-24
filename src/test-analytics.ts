import { calculateAnalytics, generateStrengths, generateSuggestions } from './analytics';

// Test data for validation (only numeric answers for analytics calculations)
const testPostAnswers = {
  1: 4, // Optimistic about future - Often
  2: 3, // Feeling useful - Some of the time
  3: 4, // Feeling relaxed - Often
  4: 3, // Dealing with problems well - Some of the time
  5: 4, // Thinking clearly - Often
  6: 3, // Connect with others comfortably - Some of the time
  7: 4, // Make up own mind - Often
  8: 7, // Self-rating in sport (1-10)
  9: 3, // Confidence changed - Improved Slightly
  10: 4, // Comfortable competing - Agree
  11: 4, // Motivated to stay active - Agree
  12: 4, // Gave physical best - Agree
  13: 2, // Made friends - Somewhat
  14: 4, // Group confidence now - Agree
  15: 8, // Overall experience (1-10)
};

const testPreAnswers = {
  1: 2, // Optimistic about future - Rarely
  2: 2, // Feeling useful - Rarely
  3: 2, // Feeling relaxed - Rarely
  4: 2, // Dealing with problems well - Rarely
  5: 2, // Thinking clearly - Rarely
  6: 2, // Connect with others comfortably - Rarely
  7: 2, // Make up own mind - Rarely
  9: 2, // Energetic - Rarely
  10: 2, // Active/not tired - Rarely
  11: 2, // Activity frequency - Rarely
  12: 2, // Social confidence - Rarely
};

const testPreSurvey = {
  name: "Test Player",
  answers: testPreAnswers,
};

// String answers for retention calculations
const testStringAnswers = {
  17: "Yes", // Would participate again
  18: "Yes", // Want personal stats
};

// Create combined answers for full analytics
const combinedPostAnswers: Record<number, number | string> = {
  ...testPostAnswers,
  ...testStringAnswers,
};

// Run calculations
const analytics = calculateAnalytics(combinedPostAnswers, testPreSurvey);
const strengths = generateStrengths(analytics);
const suggestions = generateSuggestions(analytics);

console.log("=== Analytics Test Results ===");
console.log("Pre WEMWBS-7:", analytics.preWEMWBS7);
console.log("Post WEMWBS-7:", analytics.postWEMWBS7);
console.log("Mental Growth:", analytics.mentalGrowth);
console.log("Confidence Index:", analytics.confidenceIndex);
console.log("Physical Index:", analytics.physicalIndex);
console.log("Social Index:", analytics.socialIndex);
console.log("Retention Index:", analytics.retentionIndex);
console.log("Tournament Impact Score:", analytics.tournamentImpactScore);
console.log("\nStrengths:", strengths);
console.log("Suggestions:", suggestions);

// Validation checks
console.log("\n=== Validation Checks ===");

// WEMWBS-7 validation
const expectedPreRaw = Object.values(testPreAnswers).slice(0, 7).reduce((sum, val) => sum + val, 0);
const expectedPostRaw = [1,2,3,4,5,6,7].reduce((sum, id) => sum + testPostAnswers[id], 0);
const expectedPreStandardized = Math.round(((expectedPreRaw - 7) / 28) * 100);
const expectedPostStandardized = Math.round(((expectedPostRaw - 7) / 28) * 100);

console.log("Pre WEMWBS-7 Raw Score:", analytics.preWEMWBS7.rawScore, "Expected:", expectedPreRaw);
console.log("Post WEMWBS-7 Raw Score:", analytics.postWEMWBS7.rawScore, "Expected:", expectedPostRaw);
console.log("Pre WEMWBS-7 Standardized:", analytics.preWEMWBS7.standardizedScore, "Expected:", expectedPreStandardized);
console.log("Post WEMWBS-7 Standardized:", analytics.postWEMWBS7.standardizedScore, "Expected:", expectedPostStandardized);

// Mental Growth validation
const expectedMentalGrowth = expectedPostStandardized - expectedPreStandardized;
console.log("Mental Growth Score:", analytics.mentalGrowth.score, "Expected:", expectedMentalGrowth);

// Confidence Index validation
const norm10 = (x: number) => ((x - 1) / 9) * 100;
const norm4 = (x: number) => ((x - 1) / 3) * 100;
const norm5 = (x: number) => ((x - 1) / 4) * 100;
const expectedConfidenceIndex = Math.round((norm10(testPostAnswers[8]) + norm4(testPostAnswers[9]) + norm5(testPostAnswers[10])) / 3);
console.log("Confidence Index:", analytics.confidenceIndex, "Expected:", expectedConfidenceIndex);

// Tournament Impact Score validation
const expectedTIS = Math.round(
  0.35 * analytics.postWEMWBS7.standardizedScore +
  0.25 * analytics.confidenceIndex +
  0.15 * analytics.physicalIndex +
  0.15 * analytics.socialIndex +
  0.10 * analytics.retentionIndex
);
console.log("Tournament Impact Score:", analytics.tournamentImpactScore, "Expected:", expectedTIS);

// Range validations
console.log("\n=== Range Validations ===");
console.log("Pre WEMWBS-7 Standardized (0-100):", analytics.preWEMWBS7.standardizedScore >= 0 && analytics.preWEMWBS7.standardizedScore <= 100);
console.log("Post WEMWBS-7 Standardized (0-100):", analytics.postWEMWBS7.standardizedScore >= 0 && analytics.postWEMWBS7.standardizedScore <= 100);
console.log("Confidence Index (0-100):", analytics.confidenceIndex >= 0 && analytics.confidenceIndex <= 100);
console.log("Physical Index (0-100):", analytics.physicalIndex >= 0 && analytics.physicalIndex <= 100);
console.log("Social Index (0-100):", analytics.socialIndex >= 0 && analytics.socialIndex <= 100);
console.log("Retention Index (0-100):", analytics.retentionIndex >= 0 && analytics.retentionIndex <= 100);
console.log("Tournament Impact Score (0-100):", analytics.tournamentImpactScore >= 0 && analytics.tournamentImpactScore <= 100);

export { testPostAnswers, testPreSurvey, analytics, strengths, suggestions };
