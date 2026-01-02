# Shikaku Puzzle Solver - Web Application

A modern single-page application for solving [Shikaku puzzles](https://en.wikipedia.org/wiki/Shikaku), built with React, TypeScript, and Vite.

## What is Shikaku?

Shikaku (Japanese for "rectangle") is a logic puzzle where you divide a rectangular grid into smaller rectangles. Each rectangle must contain exactly one numbered cell, and the area of that rectangle must equal the number shown.

## Overview

This web application is a complete port of the original Python CLI Shikaku solver to TypeScript, providing an interactive visual interface for creating and solving Shikaku puzzles with instant, colorful results.

## Features

- **Interactive Grid Input**: Click any cell to edit, type numbers (1-99) or '-' for void cells
- **Keyboard Navigation**: Arrow keys, Tab, and intuitive keyboard controls
- **Sample Puzzles**: Pre-loaded puzzles from the original collection
- **Multiple Solutions**: Finds and displays ALL valid solutions
- **Solution Navigation**: Browse between multiple solutions with Previous/Next buttons
- **Area Numbers Toggle**: Show/hide original puzzle clues on the solution
- **Colorful Visualization**: Each rectangle is displayed with a unique color using golden angle distribution
- **Custom Grid Sizes**: Create puzzles from 2×2 up to 30×30 (square or rectangular)
- **Irregular Grids**: Support for void cells to create non-rectangular puzzle shapes
- **Responsive Design**: Works on desktop and mobile devices
- **No Backend Required**: Fully client-side solver runs in your browser

## Getting Started

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173/](http://localhost:5173/)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
shikaku-solver/
├── src/
│   ├── solver/                # Core solving algorithm
│   │   ├── helpers.ts         # Data structures (Grid, Coord, Size, Possibility)
│   │   ├── solver.ts          # Constraint satisfaction + backtracking solver
│   │   └── parser.ts          # Puzzle input/output parsing
│   ├── components/            # React components
│   │   ├── GridInput.tsx      # Interactive puzzle input grid
│   │   ├── GridInput.css      # Grid input styling
│   │   ├── GridDisplay.tsx    # Solution visualization with colors
│   │   └── GridDisplay.css    # Grid display styling
│   ├── App.tsx                # Main application component
│   ├── App.css                # Application styles
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── CLAUDE.md                  # Detailed project documentation
└── README.md                  # This file
```

## How to Use

### Creating a Puzzle

1. **Set Grid Size**: Enter width and height (2-30) and click "Set Size"
2. **Enter Numbers**: Click any cell and type a number (1-99) representing the area size
3. **Mark Void Cells** (optional): Type `-` to create irregular-shaped grids
4. **Clear Grid**: Click "Clear Grid" to reset while keeping the size

### Solving

1. **Click "Solve Puzzle"**: Triggers the solver algorithm
2. **View Solution**: Colored rectangles appear showing the solution
3. **Toggle "Show Area Numbers"**: Display original clues on the solution
4. **Navigate Solutions**: Use "Previous" / "Next" buttons if multiple solutions exist

### Using Sample Puzzles

1. **Select from dropdown**: Choose from pre-loaded puzzles (5×5 to 24×14)
2. **Automatic loading**: Grid size and numbers are filled automatically
3. **Edit as needed**: Modify the loaded puzzle before solving

## Solver Algorithm

The solver uses a sophisticated **constraint satisfaction approach with backtracking**:

### Phase 1: Initial Possibilities
For each numbered cell (area):
1. Find all divisor pairs of the number (e.g., 12 → [1,12], [2,6], [3,4])
2. Try both orientations for each pair (width×height and height×width)
3. Check all valid placements where:
   - Rectangle contains the numbered cell
   - Rectangle fits within grid bounds
   - Rectangle only covers active (non-void) cells
   - Rectangle doesn't contain other numbered cells

### Phase 2: Constraint Propagation
Iteratively filter possibilities until convergence:

**Rectangle-based filtering:**
- If an area has exactly 1 valid rectangle → place it immediately
- If an area has 0 valid rectangles → puzzle is unsolvable
- Remove rectangles that overlap with already-placed rectangles

**Cell-based filtering:**
- If an empty cell can only be filled by one specific rectangle → place it
- If an empty cell can only be filled by one area → remove that area's rectangles that don't use this cell
- If an empty cell cannot be filled by any area → puzzle is unsolvable

### Phase 3: Backtracking (if needed)
If constraint propagation doesn't fully solve the puzzle:
1. Select the area with fewest remaining possibilities
2. Try each possibility recursively
3. Cache results to avoid re-solving identical grid states
4. Return all valid solutions found

### Performance
- **Best Case**: O(n) - constraint propagation solves directly
- **Average Case**: O(n × m) - where m = average possibilities per area
- **Worst Case**: Exponential, but heavily optimized with memoization and early pruning

## Technologies

- **React 19**: Modern UI framework with latest features
- **TypeScript**: Type-safe JavaScript for better code quality
- **Vite**: Lightning-fast build tool and dev server with HMR
- **CSS3**: Modern styling with Grid, Flexbox, and gradients
- **ESLint**: Code linting with TypeScript support

## Key Components

### Data Structures ([helpers.ts](src/solver/helpers.ts))

**Grid Class** - Central data structure:
```typescript
class Grid {
  size: Size;                    // Grid dimensions {width, height}
  areas: Map<string, number>;    // Area clues: coord -> number
  cells: number[][];             // Solution state: 2D array of rectangle IDs
  activeMask: boolean[][];       // Cell validity: false = void cell
}
```

**Supporting Types:**
- `Coord` - Cell position `{y, x}`
- `Size` - Dimensions `{height, width}`
- `Possibility` - Rectangle placement `{start: Coord, size: Size}`

### UI Components

**GridInput** ([GridInput.tsx](src/components/GridInput.tsx)):
- Interactive grid for puzzle creation
- Click-to-edit with keyboard navigation
- Arrow keys, Tab support
- Visual feedback (blue highlight for selected cell)
- Fixed 40×40px cells for stable layout

**GridDisplay** ([GridDisplay.tsx](src/components/GridDisplay.tsx)):
- Colorful solution visualization
- Golden angle color distribution for unique colors
- Thick borders between different rectangles
- Optional area number overlay
- Gray display for void cells

### Color Algorithm
```typescript
// Golden angle ensures optimal color distribution
const hue = (num * 137.508) % 360;
const color = `hsl(${hue}, 70%, 75%)`;
```

## Implementation Highlights

- **State Management**: React `useState` for all application state
- **Immutability**: Grid copying via `grid.copy()` prevents side effects
- **Performance**: `setTimeout` allows UI to show "Solving..." state
- **Memoization**: Caches previously solved grid configurations
- **Type Safety**: Full TypeScript coverage throughout

## Differences from Python Version

- ✅ Fully client-side (no backend or dependencies required)
- ✅ Interactive visual interface instead of command-line
- ✅ Real-time grid editing with instant feedback
- ✅ Color-coded solution visualization with golden angle distribution
- ✅ Responsive design for desktop and mobile
- ✅ Sample puzzle library with dropdown selection
- ✅ Multi-solution navigation with Previous/Next buttons

## Browser Support

Requires a modern browser with support for:
- ES6+ JavaScript (const, let, arrow functions, classes, modules)
- CSS Grid and Flexbox
- CSS Custom Properties (variables)
- Modern DOM APIs

**Tested on:**
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
- May require backtracking for complex puzzles

### Large Grids (20×20+)
- May take several seconds for complex configurations
- Memoization cache improves performance for similar patterns
- UI remains responsive via `setTimeout`

## Common Use Cases

### Simple Square Puzzle
```
Grid: 5×5
Enter numbers at various cells (e.g., 4, 6, 8, 9)
Result: Usually 1 unique solution
```

### Irregular Puzzle with Voids
```
Grid: 4×4
Enter numbers: 4, 4, 4
Mark some cells as void: '-'
Result: May have multiple solutions
```

### Large Complex Grid
```
Grid: 10×10 or larger
More clue numbers needed
Longer solve time but still interactive
May find multiple valid solutions
```

## Future Enhancement Ideas

- Export solution as PNG/SVG image
- Import/export puzzle text format
- Puzzle difficulty rating system
- Step-by-step solution visualization
- Undo/redo for grid editing
- Puzzle validation (check if unique solution exists)
- Timer for solving speed
- Hint system for manual solving
- Mobile app version

## Documentation

For detailed technical documentation including algorithm details, component architecture, and implementation notes, see [CLAUDE.md](CLAUDE.md).

## License

MIT License - feel free to use and modify as needed.

## Credits

Originally developed as a Python CLI solver, now reimagined as a modern web application with React and TypeScript.
