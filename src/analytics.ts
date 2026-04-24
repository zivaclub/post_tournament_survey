import { WEMWBS7Score, MentalGrowth, AnalyticsMetrics, PreSurveyRecord } from './types';

export const calculateWEMWBS7 = (answers: Record<number, number | string> | Record<string, number | string>): WEMWBS7Score => {
  const rawScore = [1, 2, 3, 4, 5, 6, 7].reduce((sum, id) => {
    // Try both numeric key (1) and string key (q1)
    let value = answers[id]; // numeric key
    if (value === undefined) {
      value = answers[`q${id}`]; // string key
    }
    
    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
    return sum + numericValue;
  }, 0);
  
  const standardizedScore = Math.round(((rawScore - 7) / 28) * 100);
  
  let label: 'Low' | 'Moderate' | 'Healthy' | 'High';
  if (standardizedScore <= 25) label = 'Low';
  else if (standardizedScore <= 50) label = 'Moderate';
  else if (standardizedScore <= 75) label = 'Healthy';
  else label = 'High';
  
  return { rawScore, standardizedScore, label };
};

export const calculateMentalGrowth = (postScore: number, preScore: number): MentalGrowth => {
  const score = postScore - preScore;
  
  let label: 'Strong Improvement' | 'Moderate Improvement' | 'Stable' | 'Decline';
  if (score >= 15) label = 'Strong Improvement';
  else if (score >= 5) label = 'Moderate Improvement';
  else if (score >= -4) label = 'Stable';
  else label = 'Decline';
  
  return { score, label };
};

const normalize10 = (value: number): number => ((value - 1) / 9) * 100;
const normalize4 = (value: number): number => ((value - 1) / 3) * 100;
const normalize5 = (value: number): number => ((value - 1) / 4) * 100;
const normalize3 = (value: number): number => ((value - 1) / 2) * 100;

export const calculateConfidenceIndex = (postAnswers: Record<number, number | string>): number => {
  const q8 = postAnswers[8] || 1;
  const q9 = postAnswers[9] || 1;
  const q10 = postAnswers[10] || 1;
  
  const normalizedQ8 = normalize10(typeof q8 === 'number' ? q8 : 1);
  const normalizedQ9 = normalize4(typeof q9 === 'number' ? q9 : 1);
  const normalizedQ10 = normalize5(typeof q10 === 'number' ? q10 : 1);
  
  return Math.round((normalizedQ8 + normalizedQ9 + normalizedQ10) / 3);
};

export const calculatePhysicalIndex = (preAnswers: Record<number, number | string> | Record<string, number | string>, postAnswers: Record<number, number | string>): number => {
  // Helper function to get value from either numeric or string keys
  const getValue = (answers: any, numericKey: number, stringKey: string, defaultValue: number = 1) => {
    let value = answers[numericKey];
    if (value === undefined) {
      value = answers[stringKey];
    }
    return typeof value === 'number' ? value : Number(value) || defaultValue;
  };
  
  const preQ9 = getValue(preAnswers, 9, 'q9');
  const preQ10 = getValue(preAnswers, 10, 'q10');
  const preQ11 = getValue(preAnswers, 11, 'q11');
  const postQ11 = getValue(postAnswers, 11, 'q11');
  const postQ12 = getValue(postAnswers, 12, 'q12');
  
  const normalizedPreQ9 = normalize5(preQ9);
  const normalizedPreQ10 = normalize5(preQ10);
  const normalizedPreQ11 = normalize5(preQ11);
  const normalizedPostQ11 = normalize5(postQ11);
  const normalizedPostQ12 = normalize5(postQ12);
  
  return Math.round((normalizedPreQ9 + normalizedPreQ10 + normalizedPreQ11 + normalizedPostQ11 + normalizedPostQ12) / 5);
};

export const calculateSocialIndex = (preAnswers: Record<number, number | string> | Record<string, number | string>, postAnswers: Record<number, number | string>): number => {
  // Helper function to get value from either numeric or string keys
  const getValue = (answers: any, numericKey: number, stringKey: string, defaultValue: number = 1) => {
    let value = answers[numericKey];
    if (value === undefined) {
      value = answers[stringKey];
    }
    return typeof value === 'number' ? value : Number(value) || defaultValue;
  };
  
  const preQ12 = getValue(preAnswers, 12, 'q12');
  const postQ13 = getValue(postAnswers, 13, 'q13');
  const postQ14 = getValue(postAnswers, 14, 'q14');
  
  const normalizedPreQ12 = normalize5(preQ12);
  const normalizedPostQ13 = normalize3(postQ13);
  const normalizedPostQ14 = normalize5(postQ14);
  
  return Math.round((normalizedPreQ12 + normalizedPostQ13 + normalizedPostQ14) / 3);
};

export const calculateRetentionIndex = (postAnswers: Record<number, number | string>): number => {
  const q17 = postAnswers[17];
  const q18 = postAnswers[18];
  
  // Convert string answers to numeric values
  const getNumericValue = (answer: number | string): number => {
    if (typeof answer === 'number') return answer;
    if (answer === 'Yes') return 3;
    if (answer === 'Maybe') return 2;
    if (answer === 'No') return 1;
    return 1; // default
  };
  
  const numericQ17 = getNumericValue(q17 || 1);
  const numericQ18 = getNumericValue(q18 || 1);
  
  const normalizedQ17 = normalize3(numericQ17);
  const normalizedQ18 = normalize3(numericQ18);
  
  return Math.round((normalizedQ17 + normalizedQ18) / 2);
};

export const calculateTournamentImpactScore = (analytics: Omit<AnalyticsMetrics, 'tournamentImpactScore'>): number => {
  const {
    postWEMWBS7,
    confidenceIndex,
    physicalIndex,
    socialIndex,
    retentionIndex
  } = analytics;
  
  const score = Math.round(
    0.35 * postWEMWBS7.standardizedScore +
    0.25 * confidenceIndex +
    0.15 * physicalIndex +
    0.15 * socialIndex +
    0.10 * retentionIndex
  );
  
  return score;
};

export const calculateAnalytics = (
  postAnswers: Record<number, number | string>,
  preSurvey?: PreSurveyRecord
): AnalyticsMetrics => {
  const preAnswers = preSurvey?.answers || {};
  
  const preWEMWBS7 = calculateWEMWBS7(preAnswers);
  const postWEMWBS7 = calculateWEMWBS7(postAnswers);
  const mentalGrowth = calculateMentalGrowth(postWEMWBS7.standardizedScore, preWEMWBS7.standardizedScore);
  const confidenceIndex = calculateConfidenceIndex(postAnswers);
  const physicalIndex = calculatePhysicalIndex(preAnswers, postAnswers);
  const socialIndex = calculateSocialIndex(preAnswers, postAnswers);
  const retentionIndex = calculateRetentionIndex(postAnswers);
  
  const analyticsWithoutTIS = {
    preWEMWBS7,
    postWEMWBS7,
    mentalGrowth,
    confidenceIndex,
    physicalIndex,
    socialIndex,
    retentionIndex
  };
  
  const tournamentImpactScore = calculateTournamentImpactScore(analyticsWithoutTIS);
  
  return {
    ...analyticsWithoutTIS,
    tournamentImpactScore
  };
};

export const generateStrengths = (analytics: AnalyticsMetrics): string[] => {
  const strengths: string[] = [];
  
  if (analytics.mentalGrowth.score >= 15) {
    strengths.push("Exceptional mental wellbeing improvement");
  } else if (analytics.mentalGrowth.score >= 5) {
    strengths.push("Strong mental growth trajectory");
  }
  
  if (analytics.confidenceIndex >= 75) {
    strengths.push("High confidence development");
  } else if (analytics.confidenceIndex >= 60) {
    strengths.push("Good confidence building");
  }
  
  if (analytics.physicalIndex >= 75) {
    strengths.push("Excellent physical motivation");
  } else if (analytics.physicalIndex >= 60) {
    strengths.push("Strong physical engagement");
  }
  
  if (analytics.socialIndex >= 75) {
    strengths.push("Outstanding social confidence");
  } else if (analytics.socialIndex >= 60) {
    strengths.push("Good social integration");
  }
  
  if (analytics.retentionIndex >= 75) {
    strengths.push("Strong future participation intent");
  }
  
  if (analytics.tournamentImpactScore >= 75) {
    strengths.push("Overall tournament success");
  }
  
  if (strengths.length === 0) {
    strengths.push("Consistent participation and effort");
  }
  
  return strengths;
};

export const generateSuggestions = (analytics: AnalyticsMetrics): string[] => {
  const suggestions: string[] = [];
  
  if (analytics.mentalGrowth.score <= -5) {
    suggestions.push("Focus on mental wellbeing strategies");
  } else if (analytics.mentalGrowth.score <= 4) {
    suggestions.push("Continue mental resilience training");
  }
  
  if (analytics.confidenceIndex < 60) {
    suggestions.push("Build confidence through skill practice");
  }
  
  if (analytics.physicalIndex < 60) {
    suggestions.push("Increase physical activity engagement");
  }
  
  if (analytics.socialIndex < 60) {
    suggestions.push("Participate in more group activities");
  }
  
  if (analytics.retentionIndex < 60) {
    suggestions.push("Explore different sport options");
  }
  
  if (analytics.tournamentImpactScore >= 75) {
    suggestions.push("Consider advanced level participation");
    suggestions.push("Mentor newer players");
  } else if (analytics.tournamentImpactScore >= 60) {
    suggestions.push("Continue regular tournament participation");
  } else {
    suggestions.push("Focus on fundamental skill development");
  }
  
  return suggestions;
};
