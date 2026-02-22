import { BlockData, GRID_COLS, MAX_VALUE, MIN_VALUE } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getRandomValue = () => Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;

export const createRow = (rowIdx: number): BlockData[] => {
  return Array.from({ length: GRID_COLS }, (_, colIdx) => ({
    id: generateId(),
    value: getRandomValue(),
    row: rowIdx,
    col: colIdx,
  }));
};

export const generateTarget = (currentGrid: BlockData[]) => {
  if (currentGrid.length === 0) return 10;
  
  // Pick 2-4 random blocks to form a target
  const numToPick = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...currentGrid].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(numToPick, shuffled.length));
  return selected.reduce((sum, b) => sum + b.value, 0);
};
