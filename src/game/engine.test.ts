import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slideAndMergeLine,
  moveBoard,
  isGameOver,
  hasReached2048,
  createEmptyMatrix,
  spawnTileInMatrix,
  initializeBoard,
  matrixToTiles,
} from './engine.ts';

test('Test Case A: [2, 2, 0, 0] moving left -> [4, 0, 0, 0]', () => {
  const result = slideAndMergeLine([2, 2, 0, 0]);
  assert.deepEqual(result.line, [4, 0, 0, 0]);
  assert.equal(result.scoreGained, 4);
});

test('Test Case B: [2, 2, 2, 0] moving left -> [4, 2, 0, 0]', () => {
  const result = slideAndMergeLine([2, 2, 2, 0]);
  assert.deepEqual(result.line, [4, 2, 0, 0]);
  assert.equal(result.scoreGained, 4);
});

test('Test Case C: [2, 2, 2, 2] moving left -> [4, 4, 0, 0]', () => {
  const result = slideAndMergeLine([2, 2, 2, 2]);
  assert.deepEqual(result.line, [4, 4, 0, 0]);
  assert.equal(result.scoreGained, 8);
});

test('Test Case D: Three 4s moving right: [0, 4, 4, 4] -> [0, 0, 4, 8] and [4, 4, 4, 0] -> [0, 0, 4, 8]', () => {
  // Board with [0, 4, 4, 4] moving right
  const board1 = [
    [0, 4, 4, 4],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const move1 = moveBoard(board1, 'RIGHT');
  assert.deepEqual(move1.nextMatrix[0], [0, 0, 4, 8]);
  assert.equal(move1.scoreGained, 8);

  // Board with [4, 4, 4, 0] moving right
  const board2 = [
    [4, 4, 4, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const move2 = moveBoard(board2, 'RIGHT');
  assert.deepEqual(move2.nextMatrix[0], [0, 0, 4, 8]);
  assert.equal(move2.scoreGained, 8);
});

test('Test Case D (standard 2048 four-tile rule): [4, 4, 4, 4] moving right -> [0, 0, 8, 8]', () => {
  const board = [
    [4, 4, 4, 4],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const move = moveBoard(board, 'RIGHT');
  assert.deepEqual(move.nextMatrix[0], [0, 0, 8, 8]);
  assert.equal(move.scoreGained, 16);
});

test('Test Case E: A move that cannot change the board -> moved is false', () => {
  const board = [
    [2, 4, 8, 16],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  // Moving UP when row 0 is already at the top
  const moveUp = moveBoard(board, 'UP');
  assert.equal(moveUp.moved, false);
  assert.deepEqual(moveUp.nextMatrix, board);

  // Moving LEFT when row 0 is already packed to the left
  const moveLeft = moveBoard(board, 'LEFT');
  assert.equal(moveLeft.moved, false);
  assert.deepEqual(moveLeft.nextMatrix, board);
});

test('Test Case F: Completely filled board with no possible merges -> game over is true', () => {
  const filledDeadlock = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  assert.equal(isGameOver(filledDeadlock), true);
});

test('Test Case G: Filled board containing a possible merge -> game over is false', () => {
  // Horizontal possible merge at [0,0] and [0,1]
  const boardWithHorizontalMerge = [
    [2, 2, 4, 8],
    [4, 8, 2, 4],
    [2, 4, 8, 2],
    [8, 2, 4, 8],
  ];
  assert.equal(isGameOver(boardWithHorizontalMerge), false);

  // Vertical possible merge at [2,3] and [3,3]
  const boardWithVerticalMerge = [
    [2, 4, 8, 16],
    [4, 8, 16, 32],
    [8, 16, 32, 64],
    [16, 32, 64, 64],
  ];
  assert.equal(isGameOver(boardWithVerticalMerge), false);

  // Board with an empty cell is never game over
  const boardWithEmpty = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 0],
  ];
  assert.equal(isGameOver(boardWithEmpty), false);
});

test('Directional Movement: Tests UP and DOWN movements', () => {
  const board = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  // Moving UP: [2, 2, 4, 0] column -> [4, 4, 0, 0]
  const moveUp = moveBoard(board, 'UP');
  assert.equal(moveUp.moved, true);
  assert.equal(moveUp.nextMatrix[0][0], 4);
  assert.equal(moveUp.nextMatrix[1][0], 4);
  assert.equal(moveUp.nextMatrix[2][0], 0);
  assert.equal(moveUp.nextMatrix[3][0], 0);
  assert.equal(moveUp.scoreGained, 4);

  // Moving DOWN from original: [2, 2, 4, 0] column -> [0, 0, 4, 4]
  const moveDown = moveBoard(board, 'DOWN');
  assert.equal(moveDown.moved, true);
  assert.equal(moveDown.nextMatrix[0][0], 0);
  assert.equal(moveDown.nextMatrix[1][0], 0);
  assert.equal(moveDown.nextMatrix[2][0], 4);
  assert.equal(moveDown.nextMatrix[3][0], 4);
  assert.equal(moveDown.scoreGained, 4);
});

test('Initial Board Setup: Spawns exactly 2 starting tiles with value 2 or 4', () => {
  const { matrix, tiles } = initializeBoard(4);
  assert.equal(tiles.length, 2);
  let nonZeroCount = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (matrix[r][c] !== 0) {
        nonZeroCount++;
        assert.ok(matrix[r][c] === 2 || matrix[r][c] === 4);
      }
    }
  }
  assert.equal(nonZeroCount, 2);
});

test('Win Condition: Detect when 2048 is reached', () => {
  const boardUnder = [
    [1024, 512, 256, 128],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.equal(hasReached2048(boardUnder), false);

  const boardWon = [
    [2048, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.equal(hasReached2048(boardWon), true);
});

test('Tile Spawning: Spawns in an empty cell with 2 or 4', () => {
  const matrix = createEmptyMatrix(4);
  const spawned = spawnTileInMatrix(matrix);
  assert.notEqual(spawned, null);
  assert.ok(spawned!.value === 2 || spawned!.value === 4);
  assert.equal(matrix[spawned!.row][spawned!.col], spawned!.value);
});

test('Animation Metadata: Merged coordinates and spawned coordinates marked accurately', () => {
  const board = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const { nextMatrix, mergedCoords } = moveBoard(board, 'LEFT');
  assert.deepEqual(mergedCoords, [{ row: 0, col: 0 }]);

  const spawnedCoord = { row: 1, col: 1 };
  nextMatrix[1][1] = 2;

  const tiles = matrixToTiles(nextMatrix, mergedCoords, spawnedCoord, 't1');
  const mergedTile = tiles.find((t) => t.row === 0 && t.col === 0);
  const spawnedTile = tiles.find((t) => t.row === 1 && t.col === 1);

  assert.equal(mergedTile?.isMerged, true);
  assert.equal(spawnedTile?.isNew, true);
});
