import {
  Grid,
  stringToCoord,
  lexicographicalGrid,
  isZoneFree,
  emptyCellsPossibilities,
  areaInfo,
  initialPossibilitiesCalculation,
  getAssumedPossibilitiesFromAnArea,
  type Possibility
} from './helpers';

let rectangleCounter = 1;
const cache = new Map<string, Set<string>>();

export function resetSolver(): void {
  rectangleCounter = 1;
  cache.clear();
}

function addRectangle(possibility: Possibility, grid: Grid): void {
  const { y, x } = possibility.start;
  const { height, width } = possibility.size;

  // Verify all cells are active
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (!grid.activeMask[row][col]) {
        throw new Error('Attempted to fill inactive cell with rectangle');
      }
    }
  }

  // Fill rectangle with current counter value
  const rectId = rectangleCounter++;
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      grid.cells[row][col] = rectId;
    }
  }
}

function resolve(
  remainingPossibilities: Map<string, Possibility[]>,
  grid: Grid
): Map<string, Possibility[]> | null {
  /**
   * Filter inaccurate possibilities and fill the grid with rectangles.
   * Run until it converges (no new results).
   */

  function filterByRectAndFind(): Map<string, Possibility[]> | null {
    const reducedPossibilities = new Map<string, Possibility[]>();

    for (const [areaCoord, areaPossibilities] of remainingPossibilities) {
      const accurateAreaPossibilities = areaPossibilities.filter(possibility =>
        isZoneFree(possibility, grid)
      );

      if (accurateAreaPossibilities.length === 0) {
        // No shape fits in the area, grid cannot be solved
        console.log(`Unsolvable - impossible for ${areaInfo(stringToCoord(areaCoord), grid)}`);
        return null;
      } else if (accurateAreaPossibilities.length === 1) {
        // Found an area solution
        console.log(`Rectangle added for ${areaInfo(stringToCoord(areaCoord), grid)} - from rectangles`);
        addRectangle(accurateAreaPossibilities[0], grid);
      } else {
        reducedPossibilities.set(areaCoord, accurateAreaPossibilities);
      }
    }

    return reducedPossibilities;
  }

  function filterByCellAndFind(): Map<string, Possibility[]> | null {
    const cellsPossibilities = emptyCellsPossibilities(remainingPossibilities, grid);

    for (const [cellCoordStr, areasPossibilities] of cellsPossibilities) {
      const cellCoord = stringToCoord(cellCoordStr);

      // Re-check as new rectangles may be added during iteration
      if (grid.cells[cellCoord.y][cellCoord.x] === 0) {
        if (areasPossibilities.size === 1) {
          // Cell used by only one area
          const [[areaCoord, cellPossibilities]] = Array.from(areasPossibilities.entries());
          const areaCoordObj = stringToCoord(areaCoord);

          // Re-check that area was not already filled
          if (grid.cells[areaCoordObj.y][areaCoordObj.x] === 0) {
            if (cellPossibilities.length === 1) {
              // Cell used by only one rectangle
              const cellPossibility = cellPossibilities[0];
              if (isZoneFree(cellPossibility, grid)) {
                console.log(`Rectangle added for ${areaInfo(areaCoordObj, grid)} - from cells`);
                addRectangle(cellPossibility, grid);
                remainingPossibilities.delete(areaCoord);
              } else {
                console.log(`Unsolvable - impossible to fit the cell ${cellCoordStr}`);
                return null;
              }
            } else {
              // Eliminate area possibilities that don't use this cell
              const currentPoss = remainingPossibilities.get(areaCoord)!;
              if (currentPoss.length > cellPossibilities.length) {
                remainingPossibilities.set(areaCoord, cellPossibilities);
                console.log(`Eliminate possibilities for ${areaInfo(areaCoordObj, grid)} not using ${cellCoordStr}`);
              }
            }
          }
        } else if (areasPossibilities.size === 0) {
          console.log(`Unsolvable - impossible to fit the cell ${cellCoordStr}`);
          return null;
        }
      }
    }

    return remainingPossibilities;
  }

  let previousState: Map<string, Possibility[]> | null = null;

  while (!mapsEqual(remainingPossibilities, previousState)) {
    previousState = new Map(remainingPossibilities);

    // Part 1: Filter inaccurate rectangles possibilities
    const filtered = filterByRectAndFind();
    if (filtered === null) {
      return null;
    }
    remainingPossibilities = filtered;

    // Part 2: Filter by cell (accelerates convergence)
    const cellFiltered = filterByCellAndFind();
    if (cellFiltered === null) {
      return null;
    }
    remainingPossibilities = cellFiltered;
  }

  if (remainingPossibilities.size === 0) {
    console.log('Solved!');
  }

  return remainingPossibilities;
}

function mapsEqual(map1: Map<string, Possibility[]> | null, map2: Map<string, Possibility[]> | null): boolean {
  if (map1 === null || map2 === null) return map1 === map2;
  if (map1.size !== map2.size) return false;

  for (const [key, val1] of map1) {
    const val2 = map2.get(key);
    if (!val2 || val1.length !== val2.length) return false;
  }

  return true;
}

function resolveWithAssumptions(
  remainingPossibilities: Map<string, Possibility[]>,
  grid: Grid
): Set<string> | null {
  const resolved = resolve(remainingPossibilities, grid);

  // Resolve algorithm converged to an end result
  if (resolved === null || resolved.size === 0) {
    return resolved !== null ? new Set([lexicographicalGrid(grid)]) : null;
  }

  // Resolver cannot finish without an assumption
  // Create hash for cache analysis
  const zerosHash = Array.from(function* () {
    for (let y = 0; y < grid.size.height; y++) {
      for (let x = 0; x < grid.size.width; x++) {
        if (grid.cells[y][x] === 0 && grid.activeMask[y][x]) {
          yield `${y},${x}`;
        }
      }
    }
  }()).join('|');

  if (cache.has(zerosHash)) {
    console.log('Configuration of the grid in the cache!');
    const cachedResults = cache.get(zerosHash)!;
    if (cachedResults.size === 0) {
      return null;
    }

    // Apply cached results to grid
    const solutions = new Set<string>();
    for (const cachedResult of cachedResults) {
      const gridCopy = grid.copy();
      const baseCounter = rectangleCounter;

      // Parse and apply cached solution
      for (let y = 0; y < grid.size.height; y++) {
        for (let x = 0; x < grid.size.width; x++) {
          if (gridCopy.cells[y][x] === 0 && gridCopy.activeMask[y][x]) {
            const idx = (y * grid.size.width + x) * 2;
            const cellValue = parseInt(cachedResult.slice(idx, idx + 2));
            gridCopy.cells[y][x] = cellValue + baseCounter;
          }
        }
      }
      solutions.add(lexicographicalGrid(gridCopy));
    }
    return solutions;
  }

  // Re-run resolver with different possibilities
  console.log('Need new assumption to continue...');
  const correctSolutions = new Set<string>();

  for (const { possibility, assumedPossibilities } of getAssumedPossibilitiesFromAnArea(resolved)) {
    console.log(`Try with possibility:`, possibility);
    const solutions = resolveWithAssumptions(assumedPossibilities, grid.copy());

    if (solutions !== null) {
      for (const solution of solutions) {
        correctSolutions.add(solution);
      }
    }
  }

  cache.set(zerosHash, correctSolutions);
  return correctSolutions.size > 0 ? correctSolutions : null;
}

export function shikakuSolve(grid: Grid): Set<string> | null {
  /**
   * Calculate all possibilities then find the good ones to resolve the grid.
   */
  resetSolver();
  const initialPossibilities = initialPossibilitiesCalculation(grid);
  return resolveWithAssumptions(initialPossibilities, grid);
}
