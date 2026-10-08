import { Game } from './components/Game/Game';
import './App.css';

/**
 * Root Application component.
 * Centers the Game component and provides the responsive viewport container.
 */
function App() {
  return (
    <div className="app-container">
      <Game />
    </div>
  );
}

export default App;
