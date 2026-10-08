/**
 * Core type definitions for the 2048 game engine and state.
 */

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface TileData {
  id: string;          // Unique identifier for the tile
  value: number;       // Value of the tile (e.g., 2, 4, 8, 16)
  row: number;         // Row position on the grid (0 to boardSize - 1)
  col: number;         // Column position on the grid (0 to boardSize - 1)
  isNew?: boolean;     // Flag to trigger spawn animation
  isMerged?: boolean;  // Flag to trigger merge pop animation
}

export interface GameState {
  boardSize: number;       // Grid dimension (default 4 for 4x4)
  tiles: TileData[];       // List of active tiles on the board
  score: number;           // Current player score
  bestScore: number;       // Best score achieved
  isGameOver: boolean;     // Whether the game has ended (no moves left)
  hasWon: boolean;         // Whether the player has reached 2048
  keepPlaying: boolean;    // Whether player chose to keep playing after reaching 2048
}
