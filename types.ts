export enum Difficulty {
  NOVICE = 'NOVICE',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  MASTER = 'MASTER'
}

export enum GameStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export enum GameMode {
  PRACTICE = 'PRACTICE',
  DRILL = 'DRILL'
}

export enum DrillDifficulty {
  HOME_ROW = 'HOME ROW',
  LOWERCASE = 'ALPHA',
  NUMBERS = 'NUMBERS',
  ALL = 'ALL'
}

export interface GameStats {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  errors: number;
  totalChars: number;
}

export interface KeystrokeData {
  key: string;
  timestamp: number;
  isCorrect: boolean;
  latency: number; // ms since last key
}

export interface KeyAnalytics {
  [key: string]: {
    total: number;
    errors: number;
    avgLatency: number;
  };
}

export interface CharacterStatus {
  char: string;
  status: 'correct' | 'incorrect' | 'pending' | 'current';
}

export interface DrillHistoryItem {
  timestamp: number;
  difficulty: DrillDifficulty;
  score: number;
  accuracy: number;
  duration: number;
}

export interface PracticeHistoryItem {
  timestamp: number;
  difficulty: Difficulty;
  wpm: number;
  accuracy: number;
  duration: number;
  analytics?: KeyAnalytics;
}