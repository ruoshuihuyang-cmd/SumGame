export type GameMode = 'classic' | 'time';

export interface BlockData {
  id: string;
  value: number;
  row: number;
  col: number;
}

export interface GameState {
  grid: BlockData[];
  target: number;
  score: number;
  highScore: number;
  gameOver: boolean;
  selectedIds: string[];
  mode: GameMode;
  timeLeft: number;
  maxTime: number;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const MAX_VALUE = 9;
export const MIN_VALUE = 1;
