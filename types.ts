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

export interface CharacterStatus {
  char: string;
  status: 'correct' | 'incorrect' | 'pending' | 'current';
}