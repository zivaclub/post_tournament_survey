export type AnswerValue = number | string;

export interface QuestionOption {
  label: string;
  value: AnswerValue;
}

export interface Question {
  id: number;
  category: string;
  text: string;
  highlight?: string;
  options?: QuestionOption[];
  inputType?: "options" | "text" | "number";
  inputPlaceholder?: string;
  min?: number;
  max?: number;
  image?: string;
  hint?: string;
}

export type AppState = "landing" | "survey" | "complete" | "admin";

export interface PreSurveyRecord {
  name: string;
  answers: Record<string, number>;
}

export interface Player {
  name: string;
}

export interface WEMWBS7Score {
  rawScore: number;
  standardizedScore: number;
  label: 'Low' | 'Moderate' | 'Healthy' | 'High';
}

export interface MentalGrowth {
  score: number;
  label: 'Strong Improvement' | 'Moderate Improvement' | 'Stable' | 'Decline';
}

export interface AnalyticsMetrics {
  preWEMWBS7: WEMWBS7Score;
  postWEMWBS7: WEMWBS7Score;
  mentalGrowth: MentalGrowth;
  confidenceIndex: number;
  physicalIndex: number;
  socialIndex: number;
  retentionIndex: number;
  tournamentImpactScore: number;
}

export interface CohortAnalytics {
  averagePreWEMWBS7: number;
  averagePostWEMWBS7: number;
  averageMentalGrowth: number;
  averageConfidenceIndex: number;
  averagePhysicalIndex: number;
  averageSocialIndex: number;
  averageRetentionIndex: number;
  averageTournamentImpactScore: number;
  improvementDistribution: {
    strongImprovement: number;
    moderateImprovement: number;
    stable: number;
    decline: number;
  };
}

export interface ComputedReport {
  analytics: AnalyticsMetrics;
  strengths: string[];
  suggestions: string[];
}

export interface PostSurveySubmission {
  player_name: string;
  timestamp: string;
  answers: Record<number, AnswerValue>;
  computed_report: ComputedReport;
  compared_with_pre: boolean;
  pre_match_found: boolean;
}
