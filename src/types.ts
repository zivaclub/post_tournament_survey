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

export interface ComputedReport {
  confidenceScore: number;
  energyScore: number;
  socialConfidence: number;
  mentalWellnessChange: number;
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
