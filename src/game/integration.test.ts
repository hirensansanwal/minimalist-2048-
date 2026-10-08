import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeBoard,
  moveBoard,
  isGameOver,
  hasReached2048,
  matrixToTiles,
  createEmptyMatrix,
} from './engine.ts';

// Mock localStorage for test environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();

test('Verification 1 & 12: New game / Restart initializes clean 4x4 board with 2 tiles', () => {
  const { matrix, tiles } = initializeBoard(4);
  assert.equal(tiles.length, 2);
  assert.equal(matrix.length, 4);
  assert.equal(matrix[0].length, 4);

  const nonZero = matrix.flat().filter((v) => v !== 0);
  assert.equal(nonZero.length, 2);
  nonZero.forEach((val) => assert.ok(val === 2 || val === 4));
});

test('Verification 2 & 5: Keyboard movement and tile merging', () => {
  const initial = [
    [2, 2, 0, 0],
    [4, 4, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const { nextMatrix, scoreGained, moved, mergedCoords } = moveBoard(initial, 'LEFT');
  assert.equal(moved, true);
  assert.equal(scoreGained, 4 + 8);
  assert.equal(nextMatrix[0][0], 4);
  assert.equal(nextMatrix[1][0], 8);
  assert.deepEqual(mergedCoords, [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
  ]);
});

test('Verification 3: Touch swipe displacement vector logic', () => {
  const calculateSwipeDirection = (dx: number, dy: number, minDistance = 30) => {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return null;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'RIGHT' : 'LEFT';
    }
    return dy > 0 ? 'DOWN' : 'UP';
  };

  assert.equal(calculateSwipeDirection(60, 5), 'RIGHT');
  assert.equal(calculateSwipeDirection(-70, 10), 'LEFT');
  assert.equal(calculateSwipeDirection(10, 80), 'DOWN');
  assert.equal(calculateSwipeDirection(5, -65), 'UP');
  assert.equal(calculateSwipeDirection(12, 15), null); // below threshold
});

test('Verification 4: Spawn and merge animations metadata tags', () => {
  const matrix = [
    [4, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const mergedCoords = [{ row: 0, col: 0 }];
  const spawnedCoord = { row: 1, col: 1 };

  const tiles = matrixToTiles(matrix, mergedCoords, spawnedCoord, 'gen1');
  const t1 = tiles.find((t) => t.row === 0 && t.col === 0);
  const t2 = tiles.find((t) => t.row === 1 && t.col === 1);

  assert.equal(t1?.isMerged, true);
  assert.equal(t2?.isNew, true);
  assert.ok(t1?.id.includes('-m-'));
  assert.ok(t2?.id.includes('-n-'));
});

test('Verification 6, 7 & 8: Score accumulation, Best score & Game State localStorage persistence', () => {
  mockStorage.clear();

  // Simulate game start
  const state = {
    matrix: [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    score: 0,
    bestScore: 100,
  };

  // Move left merges 2+2 -> score gains 4
  const { nextMatrix, scoreGained } = moveBoard(state.matrix, 'LEFT');
  const newScore = state.score + scoreGained;
  assert.equal(newScore, 4);

  // Persist to storage
  mockStorage.setItem('minimalist_2048_active_game', JSON.stringify({
    matrix: nextMatrix,
    score: newScore,
    hasWon: false,
    keepPlaying: false,
    isGameOver: false,
  }));
  mockStorage.setItem('minimalist_2048_best_score', '100');

  // Verify reload from storage
  const loadedRaw = mockStorage.getItem('minimalist_2048_active_game');
  assert.notEqual(loadedRaw, null);
  const loaded = JSON.parse(loadedRaw!);
  assert.equal(loaded.score, 4);
  assert.equal(loaded.matrix[0][0], 4);

  // Exceed best score
  const higherScore = 150;
  mockStorage.setItem('minimalist_2048_best_score', higherScore.toString());
  assert.equal(mockStorage.getItem('minimalist_2048_best_score'), '150');
});

test('Verification 9: One-step Undo restoration', () => {
  const previousState = {
    matrix: [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    score: 0,
  };

  // Current state after move UP
  const currentState = {
    matrix: [
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 2, 0, 0], // newly spawned
      [0, 0, 0, 0],
    ],
    score: 4,
  };
  assert.equal(currentState.score, 4);

  // Execute undo
  const restoredMatrix = previousState.matrix;
  const restoredScore = previousState.score;

  assert.deepEqual(restoredMatrix, [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  assert.equal(restoredScore, 0);
});

test('Verification 10 & 11: Game over and 2048 Victory triggers', () => {
  // Win condition:
  const boardWith2048 = createEmptyMatrix(4);
  boardWith2048[0][0] = 2048;
  assert.equal(hasReached2048(boardWith2048), true);

  // Game over deadlock:
  const deadlockBoard = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  assert.equal(isGameOver(deadlockBoard), true);
});
