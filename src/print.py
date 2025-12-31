import colorama as c
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from helpers import VOID_TOKEN


class Coloration:
    """Used as CM to restore default color when exit (normally or not)."""

    def __init__(self, activated):
        self.activated = activated
        self.colors = (
            c.Fore.RED, c.Fore.LIGHTRED_EX, c.Fore.GREEN, c.Fore.LIGHTGREEN_EX,
            c.Fore.YELLOW, c.Fore.LIGHTYELLOW_EX, c.Fore.BLUE, c.Fore.LIGHTBLUE_EX,
            c.Fore.MAGENTA, c.Fore.LIGHTMAGENTA_EX, c.Fore.CYAN, c.Fore.LIGHTCYAN_EX,
            c.Fore.LIGHTBLACK_EX, c.Fore.LIGHTWHITE_EX
        )

    def __enter__(self):
        if self.activated:
            c.init()
        return self

    def __exit__(self, type, value, traceback):
        if self.activated:
            print(c.Style.RESET_ALL)

    def __call__(self, selected_color):
        if not self.activated:
            return ''
        if isinstance(selected_color, int):
            return self.colors[selected_color]
        return selected_color


def _tokenize_solution(solution):
    """Split a lexicographical solution string into 2-char tokens per cell."""
    return [solution[i:i + 2] for i in range(0, len(solution), 2)]


def _solution_rows(tokens, grid):
    """Shape a flat token list into grid-sized rows."""
    return [
        tokens[row * grid.size.width:(row + 1) * grid.size.width]
        for row in range(grid.size.height)
    ]


def _collect_rectangle_bounds(solution_rows):
    """Build bounding boxes (min/max coords) for every rectangle token."""
    bounds = {}
    for y, row in enumerate(solution_rows):
        for x, token in enumerate(row):
            if token == VOID_TOKEN:
                continue
            if token not in bounds:
                bounds[token] = {'min_x': x, 'max_x': x, 'min_y': y, 'max_y': y}
                continue
            bounds[token]['min_x'] = min(bounds[token]['min_x'], x)
            bounds[token]['max_x'] = max(bounds[token]['max_x'], x)
            bounds[token]['min_y'] = min(bounds[token]['min_y'], y)
            bounds[token]['max_y'] = max(bounds[token]['max_y'], y)
    return bounds


def _figure_dimensions(grid):
    """Return a figsize tuple scaled to the puzzle dimensions."""
    base = 0.5
    min_size = 6
    return (
        max(min_size, grid.size.width * base),
        max(min_size, grid.size.height * base)
    )


def _font_size_hint(grid):
    longest = max(grid.size.width, grid.size.height)
    return max(8, 26 - longest)


def print_result(solutions, grid, to_color, list_all, keepnum):
    """Print the puzzle result(s) if any."""

    def print_grid(solution):
        """Print a puzzle solution to stdout."""
        solution_tokens = _tokenize_solution(solution)

        print('\n', color(c.Fore.WHITE), ' ', *[f'{x:02d} ' for x in range(grid.size.width)])

        for y in range(grid.size.height):
            line = f'{color(c.Fore.WHITE)}{y:02d} '

            for x in range(grid.size.width):
                element_item = solution_tokens[y * grid.size.width + x]
                if not grid.active_mask[y, x]:
                    line += f' {VOID_TOKEN} '
                    continue
                if (y, x) in grid.areas.keys() and keepnum:
                    line += f' {color(c.Fore.WHITE)}{grid.areas[(y, x)]:02d} '
                else:
                    line += f' {color(int(element_item) % 14)}{element_item} '
            print(line)

    if solutions is None:
        print('0', 'Unsolvable grid')
        return

    print(len(solutions), 'Solutions')

    with Coloration(to_color) as color:
        if list_all:
            for solution in solutions:
                print_grid(solution)
        else:
            print_grid(min(solutions))


def plot_result(solutions, grid, list_all, keepnum):
    """Render the solution(s) using matplotlib."""
    if solutions is None:
        print('0', 'Unsolvable grid')
        return

    print(len(solutions), 'Solutions')

    targets = solutions if list_all else [min(solutions)]

    for idx, solution in enumerate(targets, start=1):
        _plot_single_solution(solution, grid, keepnum, idx, len(targets))


def _plot_single_solution(solution, grid, keepnum, index, total):
    tokens = _tokenize_solution(solution)
    rows = _solution_rows(tokens, grid)
    rectangles = _collect_rectangle_bounds(rows)

    fig, ax = plt.subplots(figsize=_figure_dimensions(grid))
    fig.patch.set_facecolor('#f5f5f5')
    ax.set_facecolor('#fefefe')

    for y in range(grid.size.height):
        for x in range(grid.size.width):
            if not grid.active_mask[y, x]:
                void_rect = Rectangle(
                    (x, y),
                    1,
                    1,
                    facecolor='#d9d9d9',
                    edgecolor='white',
                    linewidth=0.8,
                    hatch='//',
                    alpha=0.6,
                    zorder=1
                )
                ax.add_patch(void_rect)

    cmap = plt.get_cmap('tab20')
    for rect_index, (token, bounds) in enumerate(rectangles.items()):
        width = bounds['max_x'] - bounds['min_x'] + 1
        height = bounds['max_y'] - bounds['min_y'] + 1
        rect = Rectangle(
            (bounds['min_x'], bounds['min_y']),
            width,
            height,
            facecolor=cmap(rect_index % cmap.N),
            edgecolor='white',
            linewidth=1.5,
            zorder=2
        )
        ax.add_patch(rect)

    ax.set_xlim(0, grid.size.width)
    ax.set_ylim(0, grid.size.height)
    ax.set_xticks(range(grid.size.width + 1))
    ax.set_yticks(range(grid.size.height + 1))
    ax.set_xticklabels([])
    ax.set_yticklabels([])
    ax.grid(color='#ffffff', linewidth=0.8, linestyle='-', alpha=0.8, zorder=5)
    ax.set_aspect('equal', adjustable='box')
    ax.invert_yaxis()

    if keepnum:
        font_size = _font_size_hint(grid)
        for coord, number in grid.areas.items():
            ax.text(
                coord.x + 0.5,
                coord.y + 0.5,
                f'{number}',
                ha='center',
                va='center',
                fontsize=font_size,
                color='#1b1b1b',
                fontweight='bold'
            )

    if total > 1:
        ax.set_title(f'Solution {index}/{total}')
    else:
        ax.set_title('Solution')

    plt.tight_layout()

    backend = plt.get_backend().lower()
    if 'agg' in backend and not plt.isinteractive():
        filename = f'shikaku-solution-{index}.png'
        fig.savefig(filename, dpi=200, bbox_inches='tight')
        print(f"Saved figure to {filename} (non-interactive backend '{backend}')")
        plt.close(fig)
    else:
        plt.show()
        plt.close(fig)
