import { Grid, coordToString, type Size } from './helpers';

export function parseGrid(input: string): Grid {
  /**
   * Parse puzzle input text and create a Grid object.
   *
   * Format:
   * WIDTH HEIGHT
   * ROW_0_DATA (space-separated)
   * ROW_1_DATA
   * ...
   *
   * Cell values:
   * - 0 = empty cell
   * - 1-N = area size (puzzle clue)
   * - '-' = void/inactive cell
   */
  const lines = input.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length < 1) {
    throw new Error('Invalid input: empty or missing size line');
  }

  // Parse first line: width height
  const [widthStr, heightStr] = lines[0].split(/\s+/);
  const width = parseInt(widthStr);
  const height = parseInt(heightStr);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid grid size: ${widthStr} ${heightStr}`);
  }

  const size: Size = { height, width };
  const areas = new Map<string, number>();
  const activeMask: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(true));

  // Parse grid rows
  for (let y = 0; y < height; y++) {
    if (y + 1 >= lines.length) {
      throw new Error(`Missing row ${y} in input`);
    }

    const rowData = lines[y + 1].split(/\s+/);

    if (rowData.length !== width) {
      throw new Error(`Row ${y} has ${rowData.length} cells, expected ${width}`);
    }

    for (let x = 0; x < width; x++) {
      const cell = rowData[x];

      if (cell === '-') {
        // Void cell
        activeMask[y][x] = false;
      } else {
        const value = parseInt(cell);
        if (isNaN(value)) {
          throw new Error(`Invalid cell value at (${y},${x}): ${cell}`);
        }

        if (value > 0) {
          // This is an area clue
          areas.set(coordToString({ y, x }), value);
        }
      }
    }
  }

  return new Grid(size, areas, undefined, activeMask);
}

export function gridToString(grid: Grid, solution?: string): string {
  /**
   * Convert a Grid to a displayable string format.
   * If solution is provided, display the solution rectangles.
   */
  const lines: string[] = [];

  if (solution) {
    // Display solution
    for (let y = 0; y < grid.size.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < grid.size.width; x++) {
        const idx = (y * grid.size.width + x) * 2;
        row.push(solution.slice(idx, idx + 2));
      }
      lines.push(row.join(' '));
    }
  } else {
    // Display input grid
    for (let y = 0; y < grid.size.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < grid.size.width; x++) {
        if (!grid.activeMask[y][x]) {
          row.push(' -');
        } else {
          const areaValue = grid.areas.get(coordToString({ y, x }));
          row.push(areaValue !== undefined ? areaValue.toString().padStart(2, ' ') : ' 0');
        }
      }
      lines.push(row.join(' '));
    }
  }

  return lines.join('\n');
}
