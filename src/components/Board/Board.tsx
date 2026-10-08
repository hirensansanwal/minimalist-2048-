import type { CSSProperties, ReactNode } from 'react';
import type { TileData } from '../../types/game';
import type { TouchHandlers } from '../../hooks/useGame';
import { Tile } from '../Tile/Tile';
import './Board.css';

interface BoardProps {
  size: number;
  tiles: TileData[];
  touchHandlers?: TouchHandlers;
  isInvalidMove?: boolean;
  children?: ReactNode;
}

/**
 * Board component renders the N×N grid (default 4×4).
 * Combines a static background grid with a dynamic layer of persistent tiles
 * that smoothly slide across cells using GPU-accelerated translate3d transforms.
 */
export const Board = ({
  size,
  tiles,
  touchHandlers,
  isInvalidMove = false,
  children,
}: BoardProps) => {
  // Generate background cell slots (16 static slots for 4×4)
  const backgroundCells = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    return { row, col, key: `cell-${row}-${col}` };
  });

  const containerClasses = `board-container ${isInvalidMove ? 'board-invalid-move' : ''}`.trim();

  return (
    <div
      className={containerClasses}
      style={{ '--board-size': size } as CSSProperties}
      onTouchStart={touchHandlers?.onTouchStart}
      onTouchEnd={touchHandlers?.onTouchEnd}
      role="grid"
      aria-label={`${size} by ${size} 2048 game board`}
      aria-rowcount={size}
      aria-colcount={size}
    >
      {/* Static Background Grid Slots */}
      <div className="board-grid" aria-hidden="true">
        {backgroundCells.map(({ row, col, key }) => (
          <div
            key={key}
            className="board-cell"
            role="gridcell"
            aria-rowindex={row + 1}
            aria-colindex={col + 1}
          />
        ))}
      </div>

      {/* Dynamic Tile Layer with Smooth Sliding Transforms */}
      <div className="tile-layer">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="tile-wrapper"
            style={{
              transform: `translate3d(calc(${tile.col} * (100% + var(--board-gap))), calc(${tile.row} * (100% + var(--board-gap))), 0)`,
            }}
          >
            <Tile
              value={tile.value}
              isNew={tile.isNew}
              isMerged={tile.isMerged}
            />
          </div>
        ))}
      </div>

      {children}
    </div>
  );
};
