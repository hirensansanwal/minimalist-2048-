import type { Direction, TileData } from '../types/game';

let tileCounter = 0;
export const getNextTileId = (): string => `tile-${++tileCounter}-${Date.now()}`;

/**
 * Creates an empty N×N number matrix (0 indicates an empty cell).
 */
export const createEmptyMatrix = (size: number): number[][] => {
  return Array.from({ length: size }, () => Array(size).fill(0));
};

export interface SlideMergeResult {
  line: number[];
  scoreGained: number;
  mergedIndices: number[];
}

/**
 * Slides and merges a single 1D row/column towards index 0.
 *
 * Rules:
 * - Empty slots (0) are removed during movement.
 * - Equal adjacent numbers merge once into their sum.
 * - A tile cannot merge more than once in a single move.
 *   e.g. [2, 2, 2, 2] -> [4, 4, 0, 0] (NOT [8, 0, 0, 0])
 */
export const slideAndMergeLine = (line: number[]): SlideMergeResult => {
  const nonZero = line.filter((val) => val !== 0);
  const result: number[] = [];
  const mergedIndices: number[] = [];
  let scoreGained = 0;
  let i = 0;

  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedVal = nonZero[i] * 2;
      mergedIndices.push(result.length);
      result.push(mergedVal);
      scoreGained += mergedVal;
      i += 2;
    } else {
      result.push(nonZero[i]);
      i += 1;
    }
  }

  while (result.length < line.length) {
    result.push(0);
  }

  return { line: result, scoreGained, mergedIndices };
};

export interface MoveBoardResult {
  nextMatrix: number[][];
  scoreGained: number;
  moved: boolean;
  mergedCoords: Array<{ row: number; col: number }>;
}

/**
 * Executes a directional slide and merge over the entire board matrix.
 */
export const moveBoard = (
  matrix: number[][],
  direction: Direction
): MoveBoardResult => {
  const size = matrix.length;
  const nextMatrix: number[][] = matrix.map((row) => [...row]);
  const mergedCoords: Array<{ row: number; col: number }> = [];
  let totalScoreGained = 0;

  if (direction === 'LEFT') {
    for (let r = 0; r < size; r++) {
      const { line, scoreGained, mergedIndices } = slideAndMergeLine(nextMatrix[r]);
      nextMatrix[r] = line;
      totalScoreGained += scoreGained;
      for (const colIdx of mergedIndices) {
        mergedCoords.push({ row: r, col: colIdx });
      }
    }
  } else if (direction === 'RIGHT') {
    for (let r = 0; r < size; r++) {
      const reversed = [...nextMatrix[r]].reverse();
      const { line, scoreGained, mergedIndices } = slideAndMergeLine(reversed);
      nextMatrix[r] = line.reverse();
      totalScoreGained += scoreGained;
      for (const reversedIdx of mergedIndices) {
        const actualCol = size - 1 - reversedIdx;
        mergedCoords.push({ row: r, col: actualCol });
      }
    }
  } else if (direction === 'UP') {
    for (let c = 0; c < size; c++) {
      const col: number[] = [];
      for (let r = 0; r < size; r++) {
        col.push(nextMatrix[r][c]);
      }
      const { line, scoreGained, mergedIndices } = slideAndMergeLine(col);
      for (let r = 0; r < size; r++) {
        nextMatrix[r][c] = line[r];
      }
      totalScoreGained += scoreGained;
      for (const rowIdx of mergedIndices) {
        mergedCoords.push({ row: rowIdx, col: c });
      }
    }
  } else if (direction === 'DOWN') {
    for (let c = 0; c < size; c++) {
      const col: number[] = [];
      for (let r = size - 1; r >= 0; r--) {
        col.push(nextMatrix[r][c]);
      }
      const { line, scoreGained, mergedIndices } = slideAndMergeLine(col);
      for (let r = size - 1, idx = 0; r >= 0; r--, idx++) {
        nextMatrix[r][c] = line[idx];
      }
      totalScoreGained += scoreGained;
      for (const reversedIdx of mergedIndices) {
        const actualRow = size - 1 - reversedIdx;
        mergedCoords.push({ row: actualRow, col: c });
      }
    }
  }

  let moved = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== nextMatrix[r][c]) {
        moved = true;
        break;
      }
    }
    if (moved) break;
  }

  return { nextMatrix, scoreGained: totalScoreGained, moved, mergedCoords };
};

export interface MoveTilesResult {
  nextTiles: TileData[];
  scoreGained: number;
  moved: boolean;
}

/**
 * Moves and merges persistent TileData entities with stable identity keys,
 * allowing CSS transitions to smoothly slide moving tiles from origin to destination.
 */
export const moveTiles = (
  tiles: TileData[],
  size: number,
  direction: Direction
): MoveTilesResult => {
  const nextTiles: TileData[] = [];
  let scoreGained = 0;
  let moved = false;

  if (direction === 'LEFT' || direction === 'RIGHT') {
    for (let r = 0; r < size; r++) {
      const rowTiles = tiles
        .filter((t) => t.row === r)
        .sort((a, b) => (direction === 'LEFT' ? a.col - b.col : b.col - a.col));

      let targetCol = direction === 'LEFT' ? 0 : size - 1;
      let i = 0;

      while (i < rowTiles.length) {
        const current = rowTiles[i];
        if (i + 1 < rowTiles.length && current.value === rowTiles[i + 1].value) {
          scoreGained += current.value * 2;
          moved = true;
          nextTiles.push({
            id: current.id,
            value: current.value * 2,
            row: r,
            col: targetCol,
            isMerged: true,
            isNew: false,
          });
          i += 2;
        } else {
          if (current.col !== targetCol || current.row !== r) {
            moved = true;
          }
          nextTiles.push({
            id: current.id,
            value: current.value,
            row: r,
            col: targetCol,
            isMerged: false,
            isNew: false,
          });
          i += 1;
        }
        targetCol += direction === 'LEFT' ? 1 : -1;
      }
    }
  } else {
    // UP or DOWN
    for (let c = 0; c < size; c++) {
      const colTiles = tiles
        .filter((t) => t.col === c)
        .sort((a, b) => (direction === 'UP' ? a.row - b.row : b.row - a.row));

      let targetRow = direction === 'UP' ? 0 : size - 1;
      let i = 0;

      while (i < colTiles.length) {
        const current = colTiles[i];
        if (i + 1 < colTiles.length && current.value === colTiles[i + 1].value) {
          scoreGained += current.value * 2;
          moved = true;
          nextTiles.push({
            id: current.id,
            value: current.value * 2,
            row: targetRow,
            col: c,
            isMerged: true,
            isNew: false,
          });
          i += 2;
        } else {
          if (current.row !== targetRow || current.col !== c) {
            moved = true;
          }
          nextTiles.push({
            id: current.id,
            value: current.value,
            row: targetRow,
            col: c,
            isMerged: false,
            isNew: false,
          });
          i += 1;
        }
        targetRow += direction === 'UP' ? 1 : -1;
      }
    }
  }

  return { nextTiles, scoreGained, moved };
};

/**
 * Spawns a single tile into the TileData list at a random unoccupied cell.
 */
export const spawnTileInTiles = (
  tiles: TileData[],
  size: number
): TileData | null => {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empty: Array<{ row: number; col: number }> = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!occupied.has(`${r},${c}`)) {
        empty.push({ row: r, col: c });
      }
    }
  }

  if (empty.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * empty.length);
  const { row, col } = empty[randomIndex];
  const value = Math.random() < 0.9 ? 2 : 4;

  const newTile: TileData = {
    id: getNextTileId(),
    value,
    row,
    col,
    isNew: true,
    isMerged: false,
  };

  tiles.push(newTile);
  return newTile;
};

/**
 * Returns a list of all coordinates currently holding 0.
 */
export const getEmptyCells = (
  matrix: number[][]
): Array<{ row: number; col: number }> => {
  const empty: Array<{ row: number; col: number }> = [];
  const size = matrix.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 0) {
        empty.push({ row: r, col: c });
      }
    }
  }
  return empty;
};

/**
 * Spawns a single new tile (90% chance of 2, 10% chance of 4) in a random empty cell.
 */
export const spawnTileInMatrix = (
  matrix: number[][]
): { row: number; col: number; value: number } | null => {
  const emptyCells = getEmptyCells(matrix);
  if (emptyCells.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const { row, col } = emptyCells[randomIndex];
  const value = Math.random() < 0.9 ? 2 : 4;
  matrix[row][col] = value;

  return { row, col, value };
};

/**
 * Checks whether the board has reached a game over state.
 */
export const isGameOver = (matrix: number[][]): boolean => {
  const size = matrix.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 0) {
        return false;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (matrix[r][c] === matrix[r][c + 1]) {
        return false;
      }
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 1; r++) {
      if (matrix[r][c] === matrix[r + 1][c]) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Checks if any cell on the board has reached or exceeded 2048.
 */
export const hasReached2048 = (matrix: number[][]): boolean => {
  return matrix.some((row) => row.some((val) => val >= 2048));
};

/**
 * Converts a 2D number matrix to an array of TileData objects.
 */
export const matrixToTiles = (
  matrix: number[][],
  mergedCoords: Array<{ row: number; col: number }> = [],
  spawnedCoord: { row: number; col: number } | null = null,
  generationToken = ''
): TileData[] => {
  const tiles: TileData[] = [];
  const size = matrix.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 0) {
        const isMerged = mergedCoords.some((m) => m.row === r && m.col === c);
        const isNew = spawnedCoord !== null && spawnedCoord.row === r && spawnedCoord.col === c;

        const animSuffix = isMerged ? `-m-${generationToken}` : isNew ? `-n-${generationToken}` : '';
        tiles.push({
          id: `tile-${r}-${c}-${matrix[r][c]}${animSuffix}`,
          value: matrix[r][c],
          row: r,
          col: c,
          isNew,
          isMerged,
        });
      }
    }
  }
  return tiles;
};

/**
 * Converts an array of TileData objects to a 2D number matrix.
 */
export const tilesToMatrix = (tiles: TileData[], size: number): number[][] => {
  const matrix = createEmptyMatrix(size);
  for (const tile of tiles) {
    if (tile.row >= 0 && tile.row < size && tile.col >= 0 && tile.col < size) {
      matrix[tile.row][tile.col] = tile.value;
    }
  }
  return matrix;
};

/**
 * Initializes a new board with 2 starting tiles (each 2 or 4).
 */
export const initializeBoard = (
  size = 4
): { matrix: number[][]; tiles: TileData[] } => {
  const tiles: TileData[] = [];
  spawnTileInTiles(tiles, size);
  spawnTileInTiles(tiles, size);
  const matrix = tilesToMatrix(tiles, size);
  return { matrix, tiles };
};
