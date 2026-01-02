import React, { useState, useRef, useEffect } from 'react';
import { Grid, coordToString } from '../solver/helpers';
import './GridInput.css';

interface GridInputProps {
  grid: Grid;
  onGridChange: (grid: Grid) => void;
}

export const GridInput: React.FC<GridInputProps> = ({ grid, onGridChange }) => {
  const [selectedCell, setSelectedCell] = useState<{ y: number; x: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  const handleCellClick = (y: number, x: number) => {
    setSelectedCell({ y, x });
  };

  const handleInputChange = (value: string) => {
    if (!selectedCell) return;

    const { y, x } = selectedCell;
    const newGrid = grid.copy();

    if (value === '-') {
      // Set as void cell
      newGrid.activeMask[y][x] = false;
      newGrid.areas.delete(coordToString({ y, x }));
    } else if (value === '' || value === '0') {
      // Empty cell
      newGrid.activeMask[y][x] = true;
      newGrid.areas.delete(coordToString({ y, x }));
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0 && numValue <= 99) {
        newGrid.activeMask[y][x] = true;
        newGrid.areas.set(coordToString({ y, x }), numValue);
      }
    }

    onGridChange(newGrid);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const { y, x } = selectedCell;

    // Alt+I/J/K/L navigation
    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'i':
          if (y > 0) setSelectedCell({ y: y - 1, x });
          e.preventDefault();
          return;
        case 'k':
          if (y < grid.size.height - 1) setSelectedCell({ y: y + 1, x });
          e.preventDefault();
          return;
        case 'j':
          if (x > 0) setSelectedCell({ y, x: x - 1 });
          e.preventDefault();
          return;
        case 'l':
          if (x < grid.size.width - 1) setSelectedCell({ y, x: x + 1 });
          e.preventDefault();
          return;
      }
    }

    switch (e.key) {
      case 'ArrowUp':
        if (y > 0) setSelectedCell({ y: y - 1, x });
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (y < grid.size.height - 1) setSelectedCell({ y: y + 1, x });
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (x > 0) setSelectedCell({ y, x: x - 1 });
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (x < grid.size.width - 1) setSelectedCell({ y, x: x + 1 });
        e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          // Shift+Tab: Move to previous cell
          let prevX = x - 1;
          let prevY = y;
          if (prevX < 0) {
            prevX = grid.size.width - 1;
            prevY--;
          }
          if (prevY >= 0) {
            setSelectedCell({ y: prevY, x: prevX });
          }
        } else {
          // Tab: Move to next cell
          let nextX = x + 1;
          let nextY = y;
          if (nextX >= grid.size.width) {
            nextX = 0;
            nextY++;
          }
          if (nextY < grid.size.height) {
            setSelectedCell({ y: nextY, x: nextX });
          }
        }
        e.preventDefault();
        break;
    }
  };

  const getCellValue = (y: number, x: number): string => {
    if (!grid.activeMask[y][x]) {
      return '-';
    }
    const areaValue = grid.areas.get(coordToString({ y, x }));
    return areaValue !== undefined ? areaValue.toString() : '';
  };

  return (
    <div className="grid-input-container">
      <div className="grid-input" style={{
        gridTemplateColumns: `repeat(${grid.size.width}, 1fr)`,
        gridTemplateRows: `repeat(${grid.size.height}, 1fr)`
      }}>
        {Array.from({ length: grid.size.height }, (_, y) =>
          Array.from({ length: grid.size.width }, (_, x) => {
            const isSelected = selectedCell?.y === y && selectedCell?.x === x;
            const value = getCellValue(y, x);
            const isVoid = !grid.activeMask[y][x];

            return (
              <div
                key={`${y},${x}`}
                className={`grid-cell ${isSelected ? 'selected' : ''} ${isVoid ? 'void' : ''}`}
                onClick={() => handleCellClick(y, x)}
              >
                {isSelected ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => setSelectedCell(null)}
                    maxLength={2}
                    className="cell-input"
                  />
                ) : (
                  <span className="cell-value">{value}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
