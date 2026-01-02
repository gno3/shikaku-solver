import { useState } from 'react';
import { Grid } from './solver/helpers';
import { shikakuSolve } from './solver/solver';
import { GridInput } from './components/GridInput';
import { GridDisplay } from './components/GridDisplay';
import './App.css';

function App() {
  const [grid, setGrid] = useState<Grid>(() => new Grid({ width: 5, height: 5 }, new Map()));
  const [solutions, setSolutions] = useState<string[] | null>(null);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = () => {
    setSolving(true);
    setError(null);
    setSolutions(null);
    setCurrentSolutionIndex(0);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const result = shikakuSolve(grid.copy());

        if (result && result.size > 0) {
          setSolutions(Array.from(result));
          setCurrentSolutionIndex(0);
        } else {
          setError('No solution found for this puzzle.');
        }
      } catch (err) {
        setError(`Error solving puzzle: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setSolving(false);
      }
    }, 100);
  };

  const handleGridSizeChange = (width: number, height: number) => {
    const newGrid = new Grid(
      { width, height },
      new Map()
    );
    setGrid(newGrid);
    setSolutions(null);
    setError(null);
  };

  const handleClearGrid = () => {
    const newGrid = new Grid(
      grid.size,
      new Map(),
      undefined,
      grid.activeMask.map(row => [...row])
    );
    setGrid(newGrid);
    setSolutions(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Shikaku Puzzle Solver</h1>
        <p className="subtitle">Create a puzzle, then click solve to see the solution</p>
      </header>

      <div className="controls-panel">
        <div className="control-group">
          <label>Grid Size:</label>
          <input
            type="number"
            min="2"
            max="30"
            value={grid.size.width}
            onChange={(e) => handleGridSizeChange(parseInt(e.target.value) || 5, grid.size.height)}
            style={{ width: '60px' }}
          />
          <span> × </span>
          <input
            type="number"
            min="2"
            max="30"
            value={grid.size.height}
            onChange={(e) => handleGridSizeChange(grid.size.width, parseInt(e.target.value) || 5)}
            style={{ width: '60px' }}
          />
        </div>

        <div className="control-group">
          <button onClick={handleClearGrid} className="btn btn-secondary">
            Clear Grid
          </button>
        </div>

        <div className="control-group">
          <button onClick={handleSolve} disabled={solving} className="btn btn-primary">
            {solving ? 'Solving...' : 'Solve Puzzle'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="grid-section">
        <div className="grid-column">
          <h2>Input Puzzle</h2>
          <p className="hint">Click cells to edit. Enter numbers (1-99) or '-' for void cells.</p>
          <GridInput grid={grid} onGridChange={setGrid} />
        </div>

        {solutions && solutions.length > 0 && (
          <div className="grid-column">
            <h2>Solution</h2>
            <p className="hint">
              {solutions.length === 1
                ? 'Unique solution found!'
                : `${solutions.length} solutions found. Navigate using the controls below.`}
            </p>
            <GridDisplay
              grid={grid}
              solution={solutions[currentSolutionIndex]}
            />
            {solutions.length > 1 && (
              <div className="control-group" style={{ marginTop: '1rem' }}>
                <label>Solution {currentSolutionIndex + 1} of {solutions.length}:</label>
                <button
                  onClick={() => setCurrentSolutionIndex(Math.max(0, currentSolutionIndex - 1))}
                  disabled={currentSolutionIndex === 0}
                  className="btn btn-small"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentSolutionIndex(Math.min(solutions.length - 1, currentSolutionIndex + 1))}
                  disabled={currentSolutionIndex === solutions.length - 1}
                  className="btn btn-small"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>
          Shikaku is a logic puzzle where you divide the grid into rectangles.
          Each rectangle must contain exactly one number, and the area of the rectangle
          must equal that number.
        </p>
      </footer>
    </div>
  );
}

export default App;
