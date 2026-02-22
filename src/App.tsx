/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RotateCcw, Play, Info, X, Zap } from 'lucide-react';
import { BlockData, GameMode, GRID_COLS, GRID_ROWS, INITIAL_ROWS } from './types';
import { createRow, generateTarget } from './utils';

export default function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [grid, setGrid] = useState<BlockData[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('sum-match-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Game
  const initGame = useCallback((selectedMode: GameMode) => {
    const initialGrid: BlockData[] = [];
    for (let i = 0; i < INITIAL_ROWS; i++) {
      initialGrid.push(...createRow(GRID_ROWS - 1 - i));
    }
    setGrid(initialGrid);
    setTarget(generateTarget(initialGrid));
    setScore(0);
    setGameOver(false);
    setSelectedIds([]);
    setMode(selectedMode);
    setTimeLeft(10);
    setIsPaused(false);
  }, []);

  // Add a new row at the bottom and push others up
  const addNewRow = useCallback(() => {
    setGrid((prev) => {
      const isFull = prev.some((b) => b.row === 0);
      if (isFull) {
        setGameOver(true);
        return prev;
      }

      const newGrid = prev.map((b) => ({ ...b, row: b.row - 1 }));
      newGrid.push(...createRow(GRID_ROWS - 1));
      return newGrid;
    });
    
    if (mode === 'time') {
      setTimeLeft(10);
    }
  }, [mode]);

  // Handle selection
  const toggleSelect = (id: string) => {
    if (gameOver || isPaused) return;
    
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  // Check sum
  useEffect(() => {
    const currentSum = grid
      .filter((b) => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + b.value, 0);

    if (currentSum === target && target > 0) {
      // Success!
      const points = selectedIds.length * 10;
      setScore((s) => s + points);
      
      setGrid((prev) => {
        const remaining = prev.filter((b) => !selectedIds.includes(b.id));
        // Simple gravity: blocks don't fall, they just disappear. 
        // But we need to ensure the grid doesn't get too empty or too full.
        return remaining;
      });
      
      setSelectedIds([]);
      
      // Update target based on remaining grid
      setGrid((prev) => {
        setTarget(generateTarget(prev));
        return prev;
      });

      if (mode === 'classic') {
        addNewRow();
      } else if (mode === 'time') {
        setTimeLeft(10);
      }
    } else if (currentSum > target) {
      // Failed, clear selection
      setSelectedIds([]);
    }
  }, [selectedIds, target, grid, mode, addNewRow]);

  // Timer logic for Time Mode
  useEffect(() => {
    if (mode === 'time' && !gameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            addNewRow();
            return 10;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, gameOver, isPaused, addNewRow]);

  // High score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sum-match-highscore', score.toString());
    }
  }, [score, highScore]);

  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md w-full"
        >
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-white italic">
              SUM<span className="text-emerald-500">MATCH</span>
            </h1>
            <p className="text-zinc-400 font-medium">数和消除：心算与速度的终极挑战</p>
          </div>

          <div className="grid gap-4">
            <button 
              onClick={() => initGame('classic')}
              className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-left transition-all hover:border-emerald-500/50 hover:bg-zinc-800/50"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> 经典模式
                </h3>
                <p className="text-zinc-500 text-sm mt-1">每次成功消除后新增一行，挑战极限生存。</p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-16 h-16 text-emerald-500" />
              </div>
            </button>

            <button 
              onClick={() => initGame('time')}
              className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-left transition-all hover:border-blue-500/50 hover:bg-zinc-800/50"
            >
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-500" /> 计时模式
                </h3>
                <p className="text-zinc-500 text-sm mt-1">在倒计时结束前完成求和，否则方块将堆积。</p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Timer className="w-16 h-16 text-blue-500" />
              </div>
            </button>
          </div>

          <div className="pt-8 border-t border-zinc-900">
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Info className="w-4 h-4" />
              <span>点击数字方块，使其总和等于目标数字</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center overflow-hidden">
      {/* Header */}
      <header className="w-full max-w-md px-6 py-4 flex items-center justify-between z-20">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Score</span>
          <span className="text-2xl font-mono font-bold text-white leading-none">{score.toString().padStart(6, '0')}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Target</span>
          <motion.div 
            key={target}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-emerald-500 italic"
          >
            {target}
          </motion.div>
        </div>

        <div className="flex flex-col items-end">
          <button 
            onClick={() => setMode(null)}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Timer Bar (Time Mode Only) */}
      {mode === 'time' && (
        <div className="w-full max-w-md px-6 mb-4">
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${(timeLeft / 10) * 100}%` }}
              className={`h-full ${timeLeft < 3 ? 'bg-red-500' : 'bg-blue-500'}`}
            />
          </div>
        </div>
      )}

      {/* Game Board */}
      <main className="relative flex-1 w-full max-w-md px-4 pb-8 flex items-end justify-center">
        <div 
          className="grid gap-2 w-full aspect-[6/10] max-h-[70vh]"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
          }}
        >
          <AnimatePresence mode="popLayout">
            {grid.map((block) => (
              <motion.button
                key={block.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  gridRowStart: block.row + 1,
                  gridColumnStart: block.col + 1
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSelect(block.id)}
                className={`
                  relative w-full h-full rounded-lg flex items-center justify-center text-xl font-bold transition-all
                  ${selectedIds.includes(block.id) 
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10' 
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}
                `}
              >
                {block.value}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {gameOver && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-xs text-center space-y-6 shadow-2xl"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white italic uppercase">Game Over</h2>
                  <p className="text-zinc-500">方块触顶了！</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Score</div>
                    <div className="text-xl font-bold text-white">{score}</div>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Best</div>
                    <div className="text-xl font-bold text-emerald-500">{highScore}</div>
                  </div>
                </div>

                <button 
                  onClick={() => initGame(mode)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" /> 再试一次
                </button>
                
                <button 
                  onClick={() => setMode(null)}
                  className="w-full text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                >
                  返回主菜单
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      <footer className="w-full max-w-md px-6 py-6 flex items-center justify-between border-t border-zinc-900">
        <div className="flex gap-4">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => initGame(mode)}
            className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-zinc-500">
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-mono font-bold">{highScore}</span>
        </div>
      </footer>
    </div>
  );
}
