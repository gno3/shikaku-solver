// Type definitions for Shikaku puzzle data structures

export interface Size {
  height: number;
  width: number;
}

export interface Coord {
  y: number;
  x: number;
}

export interface Possibility {
  start: Coord;
  size: Size;
}

export const VOID_TOKEN = '--';

export class Grid {
  size: Size;
  areas: Map<string, number>; // Map key is "y,x" string
  cells: number[][]; // 2D array of rectangle IDs
  activeMask: boolean[][]; // 2D array marking active cells

  constructor(
    size: Size,
    areas: Map<string, number>,
    cells?: number[][],
    activeMask?: boolean[][]
  ) {
    this.size = size;
    this.areas = areas;

    // Initialize cells with zeros if not provided
    if (cells) {
      this.cells = cells.map(row => [...row]);
    } else {
      this.cells = Array(size.height).fill(0).map(() => Array(size.width).fill(0));
    }

    // Initialize active mask with true if not provided
    if (activeMask) {
      if (activeMask.length !== size.height || activeMask[0]?.length !== size.width) {
        throw new Error('Active mask shape does not match grid size');
      }
      this.activeMask = activeMask.map(row => [...row]);
    } else {
      this.activeMask = Array(size.height).fill(0).map(() => Array(size.width).fill(true));
    }
  }

  copy(): Grid {
    const cellsCopy = this.cells.map(row => [...row]);
    const maskCopy = this.activeMask.map(row => [...row]);
    return new Grid(this.size, new Map(this.areas), cellsCopy, maskCopy);
  }
}

// Helper functions

export function coordToString(coord: Coord): string {
  return `${coord.y},${coord.x}`;
}

export function stringToCoord(str: string): Coord {
  const [y, x] = str.split(',').map(Number);
  return { y, x };
}

export function areaInfo(areaCoord: Coord, grid: Grid): string {
  return `area (${areaCoord.y},${areaCoord.x}) ${grid.areas.get(coordToString(areaCoord))}`;
}

export function isCellInRectangle(cellCoord: Coord, possibility: Possibility): boolean {
  return (
    possibility.start.y <= cellCoord.y &&
    cellCoord.y < possibility.start.y + possibility.size.height &&
    possibility.start.x <= cellCoord.x &&
    cellCoord.x < possibility.start.x + possibility.size.width
  );
}

export function coversOnlyActiveCells(possibility: Possibility, grid: Grid): boolean {
  const endY = possibility.start.y + possibility.size.height;
  const endX = possibility.start.x + possibility.size.width;

  for (let y = possibility.start.y; y < endY; y++) {
    for (let x = possibility.start.x; x < endX; x++) {
      if (!grid.activeMask[y]?.[x]) {
        return false;
      }
    }
  }
  return true;
}

export function isZoneFree(p: Possibility, grid: Grid): boolean {
  const endY = p.start.y + p.size.height;
  const endX = p.start.x + p.size.width;

  if (!coversOnlyActiveCells(p, grid)) {
    return false;
  }

  // Check if all cells in the rectangle are empty (0)
  for (let y = p.start.y; y < endY; y++) {
    for (let x = p.start.x; x < endX; x++) {
      if (grid.cells[y][x] !== 0) {
        return false;
      }
    }
  }
  return true;
}

export function isAnotherAreaInfoInRectangle(
  p: Possibility,
  areaCoord: Coord,
  grid: Grid
): boolean {
  const endY = p.start.y + p.size.height;
  const endX = p.start.x + p.size.width;
  const areaKey = coordToString(areaCoord);

  for (const [coordStr] of grid.areas) {
    if (coordStr === areaKey) continue;

    const coord = stringToCoord(coordStr);
    if (
      p.start.y <= coord.y && coord.y < endY &&
      p.start.x <= coord.x && coord.x < endX
    ) {
      return true;
    }
  }
  return false;
}

export function getDivisors(n: number): [number, number][] {
  const divisors: [number, number][] = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      divisors.push([i, n / i]);
    }
  }
  return divisors;
}

export function initialPossibilitiesCalculation(grid: Grid): Map<string, Possibility[]> {
  function getAvailablePlaces(areaCoord: Coord, size: [number, number]): Possibility[] {
    const solutions: Possibility[] = [];
    const sizes: [number, number][] = [size, [size[1], size[0]]];

    for (const [width, height] of sizes) {
      for (let w = 0; w < width; w++) {
        for (let h = 0; h < height; h++) {
          const startY = areaCoord.y - h;
          const startX = areaCoord.x - w;

          if (
            startX >= 0 && startY >= 0 &&
            startX + width <= grid.size.width &&
            startY + height <= grid.size.height
          ) {
            const p: Possibility = {
              start: { y: startY, x: startX },
              size: { height, width }
            };

            if (
              coversOnlyActiveCells(p, grid) &&
              !isAnotherAreaInfoInRectangle(p, areaCoord, grid)
            ) {
              solutions.push(p);
            }
          }
        }
      }

      // If square, don't rotate
      if (width === height) break;
    }

    return solutions;
  }

  const initialPossibilities = new Map<string, Possibility[]>();

  for (const [coordStr, areaSize] of grid.areas) {
    const coord = stringToCoord(coordStr);
    const possibilities: Possibility[] = [];

    for (const divisors of getDivisors(areaSize)) {
      possibilities.push(...getAvailablePlaces(coord, divisors));
    }

    initialPossibilities.set(coordStr, possibilities);
  }

  return initialPossibilities;
}

export function* emptyCells(grid: Grid): Generator<Coord> {
  for (let y = 0; y < grid.size.height; y++) {
    for (let x = 0; x < grid.size.width; x++) {
      if (grid.cells[y][x] === 0 && grid.activeMask[y][x]) {
        yield { y, x };
      }
    }
  }
}

export function emptyCellsPossibilities(
  remainingPossibilities: Map<string, Possibility[]>,
  grid: Grid
): Map<string, Map<string, Possibility[]>> {
  const emptyCellsUsage = new Map<string, Map<string, Possibility[]>>();

  // Initialize map for all empty cells
  for (const coord of emptyCells(grid)) {
    emptyCellsUsage.set(coordToString(coord), new Map());
  }

  // Fill in which areas can use each empty cell
  for (const [areaCoord, possibilities] of remainingPossibilities) {
    for (const p of possibilities) {
      for (let cellY = p.start.y; cellY < p.start.y + p.size.height; cellY++) {
        for (let cellX = p.start.x; cellX < p.start.x + p.size.width; cellX++) {
          const cellKey = coordToString({ y: cellY, x: cellX });
          if (emptyCellsUsage.has(cellKey)) {
            const cellMap = emptyCellsUsage.get(cellKey)!;
            if (!cellMap.has(areaCoord)) {
              cellMap.set(areaCoord, []);
            }
            cellMap.get(areaCoord)!.push(p);
          }
        }
      }
    }
  }

  return emptyCellsUsage;
}

export function lexicographicalGrid(grid: Grid): string {
  const letters = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));
  const asciiSolution: string[] = [];
  let iLetter = 0;
  const rectanglesLetter = new Map<number, string>();

  for (let y = 0; y < grid.size.height; y++) {
    for (let x = 0; x < grid.size.width; x++) {
      if (!grid.activeMask[y][x]) {
        asciiSolution.push(VOID_TOKEN);
        continue;
      }

      const cell = grid.cells[y][x];
      if (!rectanglesLetter.has(cell)) {
        rectanglesLetter.set(cell, letters[iLetter % letters.length]);
        iLetter++;
      }
      asciiSolution.push(rectanglesLetter.get(cell)!);
    }
  }

  return asciiSolution.join('');
}

export function getAssumedPossibilitiesFromAnArea(
  remainingPossibilities: Map<string, Possibility[]>
): { areaCoord: string; possibility: Possibility; assumedPossibilities: Map<string, Possibility[]> }[] {
  // Find area with least possibilities and biggest shape
  function getAreaCandidate(allPossibilities: Map<string, Possibility[]>): string {
    let minPossibilities = Infinity;
    for (const [, poss] of allPossibilities) {
      if (poss.length < minPossibilities) {
        minPossibilities = poss.length;
      }
    }

    const minKeys: string[] = [];
    for (const [coord, poss] of allPossibilities) {
      if (poss.length === minPossibilities) {
        minKeys.push(coord);
      }
    }

    return minKeys.reduce((maxKey, key) => {
      const maxArea = Math.max(...remainingPossibilities.get(maxKey)!.map(p => p.size.height * p.size.width));
      const keyArea = Math.max(...remainingPossibilities.get(key)!.map(p => p.size.height * p.size.width));
      return keyArea > maxArea ? key : maxKey;
    });
  }

  const candidateCoord = getAreaCandidate(remainingPossibilities);
  const results: { areaCoord: string; possibility: Possibility; assumedPossibilities: Map<string, Possibility[]> }[] = [];

  for (const rectPossibility of remainingPossibilities.get(candidateCoord)!) {
    const assumedPossibilities = new Map(remainingPossibilities);
    assumedPossibilities.set(candidateCoord, [rectPossibility]);
    results.push({ areaCoord: candidateCoord, possibility: rectPossibility, assumedPossibilities });
  }

  return results;
}
