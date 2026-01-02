# Shikaku Puzzle Solver - Web Application

## Overview

This is a single-page web application for solving Shikaku puzzles, built with React, TypeScript, and Vite. Shikaku is a Japanese logic puzzle where you divide a rectangular grid into smaller rectangles. Each rectangle must contain exactly one numbered cell, and the area of that rectangle must equal the number.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **CSS3** - Modern styling with CSS Grid and Flexbox

## Project Structure

```
web/
├── src/
│   ├── solver/                    # Core solving algorithm
│   │   ├── helpers.ts            # Data structures and utilities
│   │   ├── solver.ts             # Main constraint satisfaction algorithm
│   │   └── parser.ts             # Grid parsing utilities
│   ├── components/               # React components
│   │   ├── GridInput.tsx         # Interactive puzzle input
│   │   ├── GridInput.css
│   │   ├── GridDisplay.tsx       # Solution visualization
│   │   └── GridDisplay.css
│   ├── App.tsx                   # Main application
│   ├── App.css                   # Application styles
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── vite.config.ts               # Vite config
```

## Core Components

### 1. Data Structures ([helpers.ts](web/src/solver/helpers.ts))

#### Grid Class
The central data structure representing a Shikaku puzzle:

```typescript
class Grid {
  size: Size;              // Grid dimensions (width, height)
  areas: Map<string, number>;  // Area clues: coord -> number
  cells: number[][];       // Solution state: 2D array of rectangle IDs
  activeMask: boolean[][]; // Cell validity: false = void cell
}
```

#### Supporting Types
- `Coord` - Cell position `{y, x}`
- `Size` - Dimensions `{height, width}`
- `Possibility` - Rectangle placement `{start: Coord, size: Size}`

### 2. Solver Algorithm ([solver.ts](web/src/solver/solver.ts))

The solver uses a **constraint satisfaction** approach with **backtracking**:

#### Phase 1: Initial Possibilities
For each numbered cell (area):
1. Find all divisor pairs of the number (e.g., 12 → [1,12], [2,6], [3,4])
2. For each divisor pair, try both orientations (width×height and height×width)
3. Check all valid placements where:
   - Rectangle contains the numbered cell
   - Rectangle fits within grid bounds
   - Rectangle only covers active (non-void) cells
   - Rectangle doesn't contain other numbered cells

#### Phase 2: Constraint Propagation
Iteratively filter possibilities until convergence:

**Rectangle-based filtering:**
- If an area has exactly 1 valid rectangle → place it
- If an area has 0 valid rectangles → puzzle is unsolvable
- Remove rectangles that overlap with already-placed rectangles

**Cell-based filtering:**
- If an empty cell can only be filled by one specific rectangle → place it
- If an empty cell can only be filled by one area → remove that area's rectangles that don't use this cell
- If an empty cell cannot be filled by any area → puzzle is unsolvable

#### Phase 3: Backtracking (if needed)
If constraint propagation doesn't fully solve the puzzle:
1. Select the area with fewest remaining possibilities and largest size
2. Try each of its possibilities recursively
3. Cache results to avoid re-solving identical grid states
4. Return all valid solutions found

### 3. React Components

#### GridInput Component ([GridInput.tsx](web/src/components/GridInput.tsx))

Interactive grid for puzzle creation:
- **Click-to-edit** - Click any cell to select it
- **Keyboard input** - Type numbers (1-99) or '-' for void cells
- **Arrow keys** - Navigate between cells
- **Tab key** - Move to next cell
- **Visual feedback** - Selected cell highlighted in blue

**Key Features:**
- Fixed 40×40px cell dimensions
- Real-time grid updates via `onGridChange` callback
- Distinguishes empty (0), numbered, and void cells

#### GridDisplay Component ([GridDisplay.tsx](web/src/components/GridDisplay.tsx))

Colorful solution visualization:
- **Color coding** - Each rectangle gets a unique color using golden angle distribution
- **Border drawing** - Thick borders only between different rectangles
- **Area numbers** - Optional overlay of original clue numbers
- **Void cells** - Displayed in gray

**Color Algorithm:**
```typescript
// Golden angle ensures good color distribution
const hue = (num * 137.508) % 360;
const color = `hsl(${hue}, 70%, 75%)`;
```

#### App Component ([App.tsx](web/src/App.tsx))

Main application orchestrating all features:
- Grid state management
- Solver execution
- Solution navigation (for multiple solutions)
- Controls for grid size, clear, solve, and display options

## User Interface Flow

### Creating a Puzzle

1. **Set Grid Size** - Use width × height inputs (2-30)
2. **Enter Numbers** - Click cells and type area numbers
3. **Mark Voids** (optional) - Type '-' for irregular grids
4. **Clear Grid** - Reset all cells while keeping size

### Solving

1. **Click "Solve Puzzle"** - Triggers solver algorithm
2. **View Solution** - Colored rectangles appear on the right
3. **Toggle Area Numbers** - Show/hide original clues
4. **Navigate Solutions** - If multiple solutions exist, use Previous/Next buttons

## Key Features

### 1. Interactive Grid Editing
- Fixed-size cells prevent layout shifts
- Immediate visual feedback
- Keyboard-friendly navigation

### 2. Multiple Solution Support
- Finds ALL valid solutions
- Navigate between solutions
- Shows solution count

### 3. Area Number Overlay
- Toggle to see original clues on solution
- Helps verify solution correctness
- Numbers displayed with white outline for visibility

### 4. Custom Grid Sizes
- Square grids: 2×2 to 30×30
- Rectangular grids: Any combination
- Irregular grids: Use void cells (-)

### 5. Responsive Design
- Works on desktop and mobile
- Gradient background with purple/blue theme
- Clean, modern UI with rounded corners and shadows

## Development

### Setup
```bash
cd web
npm install
```

### Development Server
```bash
npm run dev
# Opens at http://localhost:5173/
```

### Build for Production
```bash
npm run build
# Output in dist/ directory
```

### Type Checking
```bash
npm run build  # Runs TypeScript compiler
```

## Algorithm Complexity

- **Best Case** - O(n) when constraint propagation solves directly
- **Average Case** - O(n × m) where m = average possibilities per area
- **Worst Case** - Exponential with backtracking, but heavily optimized with:
  - Memoization (caching identical grid states)
  - Early pruning (fail fast on unsolvable configurations)
  - Smart area selection (fewest possibilities first)

## Implementation Details

### State Management
- React `useState` for all application state
- Grid immutability via `grid.copy()` method
- Solutions stored as lexicographical string arrays

### Performance Optimizations
1. **Fixed cell dimensions** - Prevents layout thrashing
2. **setTimeout for solving** - Allows UI to show "Solving..." state
3. **Memoization** - Caches previously solved grid configurations
4. **Efficient filtering** - Two-phase approach reduces search space quickly

### Styling Approach
- **CSS Grid** - For puzzle grid layout
- **Flexbox** - For controls and page layout
- **CSS Custom Properties** - Could be added for theming
- **No external UI libraries** - Pure CSS for minimal bundle size

## Common Use Cases

### Simple Square Puzzle
```
Grid: 5×5
Enter numbers: 4, 6, 8, 9, etc.
Solve → Usually 1 solution
```

### Irregular Puzzle
```
Grid: 4×4
Enter numbers: 4, 4, 4
Mark bottom-right as void: - -
Solve → May have multiple solutions
```

### Large Grid
```
Grid: 10×10 or larger
More complex, longer solve time
May have multiple solutions
```

## Error Handling

The application handles:
- **No solution found** - Shows error message
- **Invalid grid configurations** - Prevented by UI constraints
- **Solver errors** - Caught and displayed to user

## Future Enhancement Ideas

- Export solution as PNG image
- Import/export puzzle text format
- Puzzle difficulty rating
- Step-by-step solution visualization
- Undo/redo for grid editing
- Puzzle validation (check if unique solution exists)
- Timer for solving
- Hints system

## Browser Compatibility

Requires modern browser with support for:
- ES6+ JavaScript (const, let, arrow functions, etc.)
- CSS Grid and Flexbox
- CSS Custom Properties
- Modern DOM APIs

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Characteristics

### Small Grids (5×5 or less)
- Instant solving (<100ms)
- Smooth UI interactions

### Medium Grids (10×10)
- Typically <1 second
- May need backtracking

### Large Grids (20×20+)
- May take several seconds
- Cache helps with similar configurations
- UI remains responsive via setTimeout

## Code Quality

- **Type Safety** - Full TypeScript coverage
- **Immutability** - Grid copying prevents side effects
- **Separation of Concerns** - Solver logic separate from UI
- **Component Reusability** - GridInput and GridDisplay are self-contained
- **Clear Naming** - Descriptive variable and function names

## Puzzle Format

Input grid format (for reference):
```
WIDTH HEIGHT
ROW_0_VALUES (space-separated)
ROW_1_VALUES
...

Values:
0 = empty cell
1-99 = area number
- = void cell
```

Solution format (lexicographical):
```
Two-digit IDs for each cell: 00 01 02 ...
Void cells: --
Same ID = same rectangle
```
