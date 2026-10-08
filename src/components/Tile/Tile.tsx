import './Tile.css';

interface TileProps {
  value: number;
  isNew?: boolean;
  isMerged?: boolean;
}

/**
 * Tile component represents an individual numbered tile on the board.
 * Sets the appropriate visual theme, typography scaling, and animation triggers.
 */
export const Tile = ({ value, isNew, isMerged }: TileProps) => {
  // Determine CSS class based on tile value
  const valueClass = value <= 2048 ? `tile-val-${value}` : 'tile-val-super';

  // Determine font scaling based on number of digits
  const digitCount = value.toString().length;
  const digitsClass = digitCount <= 4 ? `tile-digits-${digitCount}` : 'tile-digits-5';

  // Animation classes
  const animClasses = `${isNew ? 'tile-new' : ''} ${isMerged ? 'tile-merged' : ''}`.trim();

  return (
    <div
      className={`tile ${valueClass} ${digitsClass} ${animClasses}`.trim()}
      data-value={value}
      aria-label={`Tile with value ${value}`}
    >
      {value}
    </div>
  );
};
