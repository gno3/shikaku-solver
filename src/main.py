from solver import shikaku_solve
from print import print_result, plot_result
from helpers import Grid, Coord
import logging
import argparse
import numpy as np


def read_grid(read_line=input):
    """Read the grid from an input (file or stdin)."""
    width, height = [int(i) for i in read_line().split()]
    areas = {}
    active_mask = np.ones((height, width), dtype=bool)

    for row in range(height):
        tokens = read_line().split()
        if len(tokens) < width:
            tokens.extend(['-'] * (width - len(tokens)))
        tokens = tokens[:width]

        for column, token in enumerate(tokens):
            if token == '-':
                active_mask[row, column] = False
                continue

            value = int(token)
            if value > 0:
                areas[Coord(row, column)] = value

    return Grid((height, width), areas, active_mask=active_mask)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--file",
                        help="provide a path to a puzzle grid")
    parser.add_argument("--color",
                        help="apply ANSI colors to text output", action="store_true")
    parser.add_argument("--all",
                        help="print all possible solutions", action="store_true")
    parser.add_argument("--keepnum",
                        help="keep the numbers in the output", action="store_true")
    parser.add_argument("--output",
                        choices=["text", "grid"],
                        default="text",
                        help="choose how to display the solution")
    parser.add_argument("-v", "--verbose",
                        help="log informative message", action='count', default=0)
    args = parser.parse_args()

    if args.file:
        with open(args.file) as f:
            grid = read_grid(f.readline)
    else:
        grid = read_grid()

    if args.verbose > 0:
        logging.basicConfig(level=logging.INFO if args.verbose == 1 else logging.DEBUG)

    results = shikaku_solve(grid)

    if args.output == 'grid':
        plot_result(results, grid, args.all, args.keepnum)
    else:
        print_result(results, grid, args.color, args.all, args.keepnum)