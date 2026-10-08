import { useGame } from '../../hooks/useGame';
import { Board } from '../Board/Board';
import './Game.css';

/**
 * Main Game component.
 * Integrates game state with responsive visuals, undo controls, score addition feedback,
 * touch gestures, and accessible modal overlays.
 */
export const Game = () => {
  const {
    gameState,
    canUndo,
    scoreAddition,
    isInvalidMove,
    undo,
    startNewGame,
    continuePlaying,
    touchHandlers,
  } = useGame(4);

  return (
    <main className="game-wrapper" aria-label="2048 Puzzle Game">
      {/* Game Header: Title and Scoreboards */}
      <header className="game-header">
        <div className="game-title-group">
          <h1>2048</h1>
          <p className="game-subtitle">Join numbers to reach <strong>2048!</strong></p>
        </div>

        <section className="game-scores" aria-label="Game Scores">
          <div className="score-box" aria-label={`Current Score: ${gameState.score}`}>
            <div className="score-label">Score</div>
            <div className="score-value" aria-live="polite">{gameState.score}</div>
            {scoreAddition && (
              <div
                key={scoreAddition.id}
                className="score-addition"
                aria-hidden="true"
              >
                +{scoreAddition.amount}
              </div>
            )}
          </div>
          <div className="score-box" aria-label={`Best Score: ${gameState.bestScore}`}>
            <div className="score-label">Best</div>
            <div className="score-value">{gameState.bestScore}</div>
          </div>
        </section>
      </header>

      {/* Actions and Controls Toolbar */}
      <section className="game-controls" aria-label="Game Controls">
        <p className="game-instructions-brief">
          Swipe or press arrow keys to slide
        </p>
        <div className="controls-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo last move"
            title={canUndo ? 'Undo last move (U)' : 'No moves to undo'}
          >
            Undo
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={startNewGame}
            aria-label="Start a new 2048 game"
          >
            New Game
          </button>
        </div>
      </section>

      {/* 4x4 Game Board with touch listeners, invalid move shake, and overlays */}
      <Board
        size={gameState.boardSize}
        tiles={gameState.tiles}
        touchHandlers={touchHandlers}
        isInvalidMove={isInvalidMove}
      >
        {/* Victory Overlay: Player reached 2048 */}
        {gameState.hasWon && !gameState.keepPlaying && (
          <div
            className="board-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="victory-title"
          >
            <h2 id="victory-title" className="overlay-title">🎉 You Win!</h2>
            <p className="overlay-subtitle">You reached the 2048 tile!</p>
            <p className="overlay-score">Score: {gameState.score}</p>
            <div className="overlay-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={continuePlaying}
                aria-label="Keep playing beyond 2048"
              >
                Keep Going
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={startNewGame}
                aria-label="Start a new game"
              >
                New Game
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay: No valid moves remaining */}
        {gameState.isGameOver && (
          <div
            className="board-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gameover-title"
          >
            <h2 id="gameover-title" className="overlay-title">Game Over!</h2>
            <p className="overlay-subtitle">No more possible moves</p>
            <p className="overlay-score">Final Score: {gameState.score}</p>
            <div className="overlay-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo last move to try again"
              >
                Undo Move
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={startNewGame}
                aria-label="Restart game"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </Board>

      {/* Instructions Card for Desktop & Mobile users */}
      <footer className="game-instructions-card">
        <h2 className="instructions-title">How to Play</h2>
        <p className="instructions-rule">
          When two tiles with the same number collide, they <strong>merge into one!</strong>
        </p>
        <div className="instructions-controls">
          <div>
            💻 <strong>Desktop:</strong> Use <span className="kbd-key">↑</span> <span className="kbd-key">↓</span> <span className="kbd-key">←</span> <span className="kbd-key">→</span> or <span className="kbd-key">W</span> <span className="kbd-key">A</span> <span className="kbd-key">S</span> <span className="kbd-key">D</span> (Press <span className="kbd-key">U</span> to Undo).
          </div>
          <div>
            📱 <strong>Mobile & Tablet:</strong> Swipe in any direction across the board.
          </div>
        </div>
      </footer>
    </main>
  );
};
