import { useState, useEffect, useCallback, useRef } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import type { Direction, GameState, TileData } from '../types/game';
import {
  initializeBoard,
  moveTiles,
  spawnTileInTiles,
  isGameOver as checkIsGameOver,
  hasReached2048,
  tilesToMatrix,
  matrixToTiles,
} from '../game/engine';

const BEST_SCORE_STORAGE_KEY = 'minimalist_2048_best_score';
const ACTIVE_GAME_STORAGE_KEY = 'minimalist_2048_active_game';

export interface TouchHandlers {
  onTouchStart: (e: ReactTouchEvent) => void;
  onTouchEnd: (e: ReactTouchEvent) => void;
}

export interface ScoreAddition {
  id: number;
  amount: number;
}

export interface UseGameReturn {
  gameState: GameState;
  canUndo: boolean;
  scoreAddition: ScoreAddition | null;
  isInvalidMove: boolean;
  handleMove: (direction: Direction) => boolean;
  undo: () => void;
  startNewGame: () => void;
  continuePlaying: () => void;
  touchHandlers: TouchHandlers;
}

interface SavedGameData {
  matrix: number[][];
  score: number;
  hasWon: boolean;
  keepPlaying: boolean;
  isGameOver: boolean;
}

/**
 * Loads previously persisted active game state from localStorage if valid.
 */
const loadSavedGame = (boardSize: number): SavedGameData | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameData;
    if (
      Array.isArray(parsed.matrix) &&
      parsed.matrix.length === boardSize &&
      typeof parsed.score === 'number'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Custom React hook managing the 2048 game state, persistence, undo, animations, and controls.
 */
export const useGame = (initialSize = 4): UseGameReturn => {
  const [boardSize] = useState<number>(initialSize);

  // Initialize from localStorage or generate fresh board
  const [savedData] = useState<SavedGameData | null>(() => loadSavedGame(initialSize));

  const [matrix, setMatrix] = useState<number[][]>(() => {
    if (savedData) return savedData.matrix;
    const { matrix: freshMatrix } = initializeBoard(initialSize);
    return freshMatrix;
  });

  const [tiles, setTiles] = useState<TileData[]>(() => {
    if (savedData) return matrixToTiles(savedData.matrix);
    return matrixToTiles(matrix);
  });

  const [score, setScore] = useState<number>(() => (savedData ? savedData.score : 0));

  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(BEST_SCORE_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [hasWon, setHasWon] = useState<boolean>(() => (savedData ? savedData.hasWon : false));
  const [keepPlaying, setKeepPlaying] = useState<boolean>(() => (savedData ? savedData.keepPlaying : false));
  const [isGameOverState, setIsGameOverState] = useState<boolean>(() => (savedData ? savedData.isGameOver : false));

  // One-step undo snapshot
  const [previousState, setPreviousState] = useState<{
    matrix: number[][];
    score: number;
    tiles: TileData[];
  } | null>(null);

  // Score addition visual feedback (+points)
  const [scoreAddition, setScoreAddition] = useState<ScoreAddition | null>(null);

  // Invalid move feedback (board shake)
  const [isInvalidMove, setIsInvalidMove] = useState<boolean>(false);
  const invalidMoveTimeoutRef = useRef<number | null>(null);

  // Touch gesture tracker
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Save active game to localStorage
  const persistGame = useCallback(
    (currentMatrix: number[][], currentScore: number, currentWon: boolean, currentKeepPlaying: boolean, currentGameOver: boolean) => {
      try {
        const payload: SavedGameData = {
          matrix: currentMatrix,
          score: currentScore,
          hasWon: currentWon,
          keepPlaying: currentKeepPlaying,
          isGameOver: currentGameOver,
        };
        localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore quota/private browsing exceptions
      }
    },
    []
  );

  // Restart / New Game
  const startNewGame = useCallback(() => {
    const { matrix: freshMatrix, tiles: freshTiles } = initializeBoard(boardSize);
    setMatrix(freshMatrix);
    setTiles(freshTiles);
    setScore(0);
    setHasWon(false);
    setKeepPlaying(false);
    setIsGameOverState(false);
    setPreviousState(null);
    setScoreAddition(null);
    persistGame(freshMatrix, 0, false, false, false);
  }, [boardSize, persistGame]);

  // Keep playing after reaching 2048
  const continuePlaying = useCallback(() => {
    setKeepPlaying(true);
    persistGame(matrix, score, hasWon, true, isGameOverState);
  }, [matrix, score, hasWon, isGameOverState, persistGame]);

  // One-step undo implementation
  const undo = useCallback(() => {
    if (!previousState || isGameOverState) return;

    setMatrix(previousState.matrix);
    setTiles(previousState.tiles);
    setScore(previousState.score);
    setPreviousState(null);
    persistGame(previousState.matrix, previousState.score, hasWon, keepPlaying, false);
  }, [previousState, isGameOverState, hasWon, keepPlaying, persistGame]);

  // Primary move handler with stable entity sliding
  const handleMove = useCallback(
    (direction: Direction): boolean => {
      if (isGameOverState) return false;
      if (hasWon && !keepPlaying) return false;

      // Move tile entities with persistent identity keys
      const { nextTiles, scoreGained, moved } = moveTiles(tiles, boardSize, direction);

      // Rule: Do not generate a new tile or change state if move didn't change the board
      if (!moved) {
        setIsInvalidMove(true);
        if (invalidMoveTimeoutRef.current) {
          window.clearTimeout(invalidMoveTimeoutRef.current);
        }
        invalidMoveTimeoutRef.current = window.setTimeout(() => {
          setIsInvalidMove(false);
        }, 220);
        return false;
      }

      // Record snapshot for one-step undo before mutating state
      setPreviousState({
        matrix: tilesToMatrix(tiles, boardSize),
        score,
        tiles: tiles.map((t) => ({ ...t })),
      });

      // Update score and trigger score feedback animation
      const newScore = score + scoreGained;
      setScore(newScore);
      if (scoreGained > 0) {
        setScoreAddition({ id: Date.now(), amount: scoreGained });
      }

      // Persist best score
      if (newScore > bestScore) {
        setBestScore(newScore);
        try {
          localStorage.setItem(BEST_SCORE_STORAGE_KEY, newScore.toString());
        } catch {
          // Ignore localStorage errors
        }
      }

      // Spawn exactly one new tile in an empty position
      spawnTileInTiles(nextTiles, boardSize);

      const nextMatrix = tilesToMatrix(nextTiles, boardSize);

      // Check win condition (reached 2048)
      let wonState = hasWon;
      if (!hasWon && hasReached2048(nextMatrix)) {
        wonState = true;
        setHasWon(true);
      }

      // Check game-over condition
      const gameOver = checkIsGameOver(nextMatrix);
      if (gameOver) {
        setIsGameOverState(true);
      }

      setMatrix(nextMatrix);
      setTiles(nextTiles);
      persistGame(nextMatrix, newScore, wonState, keepPlaying, gameOver);

      return true;
    },
    [tiles, boardSize, isGameOverState, hasWon, keepPlaying, score, bestScore, persistGame]
  );

  // Keyboard controls: Arrow keys, WASD, and U/Z for Undo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // Handle Undo via keyboard (U or Z)
      if (event.key === 'u' || event.key === 'U' || (event.key === 'z' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault();
        undo();
        return;
      }

      let direction: Direction | null = null;
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'RIGHT';
          break;
        default:
          return;
      }

      // Prevent the browser from scrolling
      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (invalidMoveTimeoutRef.current) {
        window.clearTimeout(invalidMoveTimeoutRef.current);
      }
    };
  }, [handleMove, undo]);

  // Touch gesture handlers
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const start = touchStartRef.current;
      const end = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };
      touchStartRef.current = null;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const minSwipeDistance = 30;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < minSwipeDistance) {
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        handleMove(dy > 0 ? 'DOWN' : 'UP');
      }
    },
    [handleMove]
  );

  return {
    gameState: {
      boardSize,
      tiles,
      score,
      bestScore,
      isGameOver: isGameOverState,
      hasWon,
      keepPlaying,
    },
    canUndo: previousState !== null && !isGameOverState,
    scoreAddition,
    isInvalidMove,
    handleMove,
    undo,
    startNewGame,
    continuePlaying,
    touchHandlers: {
      onTouchStart,
      onTouchEnd,
    },
  };
};
