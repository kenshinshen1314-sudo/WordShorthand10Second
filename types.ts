
export interface WordExample {
  en: string;
  zh: string;
}

export interface Synonym {
  word: string;
  translation: string;
}

export interface WordData {
  word: string;
  phonetic: string;
  translation: string;
  definition: string;
  examples: WordExample[];
  synonyms: Synonym[];
  mnemonic: string;
  imageUrl?: string;
}

export interface ReviewItem {
  wordData: WordData;
  lastMasteredAt: number;
  stage: number; // 0: new, 1: 1h, 2: 1d, 3: 3d, 4: 7d
  nextReviewAt: number;
}

export const REVIEW_INTERVALS = [
  0,
  1 * 60 * 60 * 1000,         // 1 hour
  24 * 60 * 60 * 1000,        // 1 day
  3 * 24 * 60 * 60 * 1000,    // 3 days
  7 * 24 * 60 * 60 * 1000     // 7 days
];

export enum AppState {
  HOME = 'HOME',
  LOADING = 'LOADING',
  LEARNING = 'LEARNING',
  REVIEWING = 'REVIEWING',
  SUMMARY = 'SUMMARY'
}

export type Category = 'TOEFL' | 'IELTS' | 'GRE' | 'SAT' | 'General';
