import React from 'react';
import { Grid, coordToString, VOID_TOKEN } from '../solver/helpers';
import './GridDisplay.css';

interface GridDisplayProps {
  grid: Grid;
  solution: string;
}

// Generate a color from a number (for rectangle visualization)
function getColorFromNumber(num: number): string {
  const hue = (num * 137.508) % 360; // Golden angle for good distribution
  return `hsl(${hue}, 70%, 75%)`;
}

export const GridDisplay: React.FC<GridDisplayProps> = ({ grid, solution }) => {
  // Parse solution string into 2D array of rectangle IDs
  const solutionGrid: string[][] = [];
  let idx = 0;
  for (let y = 0; y < grid.size.height; y++) {
    solutionGrid[y] = [];
    for (let x = 0; x < grid.size.width; x++) {
      solutionGrid[y][x] = solution.slice(idx, idx + 2);
      idx += 2;
    }
  }

  // Get area number for a cell (if it exists)
  const getAreaNumber = (y: number, x: number): number | undefined => {
    return grid.areas.get(coordToString({ y, x }));
  };

  // Check if borders should be drawn
  const shouldDrawBorder = (y: number, x: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean => {
    const current = solutionGrid[y][x];

    switch (direction) {
      case 'top':
        return y === 0 || solutionGrid[y - 1][x] !== current;
      case 'right':
        return x === grid.size.width - 1 || solutionGrid[y][x + 1] !== current;
      case 'bottom':
        return y === grid.size.height - 1 || solutionGrid[y + 1][x] !== current;
      case 'left':
        return x === 0 || solutionGrid[y][x - 1] !== current;
    }
  };

  return (
    <div className="grid-display-container">
      <div className="grid-display" style={{
        gridTemplateColumns: `repeat(${grid.size.width}, 1fr)`,
        gridTemplateRows: `repeat(${grid.size.height}, 1fr)`
      }}>
        {solutionGrid.map((row, y) =>
          row.map((cellId, x) => {
            const isVoid = cellId === VOID_TOKEN;
            const color = isVoid ? '#ccc' : getColorFromNumber(parseInt(cellId));
            const areaNumber = getAreaNumber(y, x);

            const borderStyle = {
              borderTop: shouldDrawBorder(y, x, 'top') ? '2px solid #333' : 'none',
              borderRight: shouldDrawBorder(y, x, 'right') ? '2px solid #333' : 'none',
              borderBottom: shouldDrawBorder(y, x, 'bottom') ? '2px solid #333' : 'none',
              borderLeft: shouldDrawBorder(y, x, 'left') ? '2px solid #333' : 'none',
            };

            return (
              <div
                key={`${y},${x}`}
                className={`display-cell ${isVoid ? 'void' : ''}`}
                style={{
                  backgroundColor: color,
                  ...borderStyle
                }}
              >
                {areaNumber !== undefined && (
                  <span className="area-number">{areaNumber}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
