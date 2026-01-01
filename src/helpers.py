from operator import mul
import numpy as np
import math
import logging
from collections import namedtuple, defaultdict
from functools import wraps


Size = namedtuple('Size', ['height', 'width'])
Coord = namedtuple('Coord', ['y', 'x'])
Possibility = namedtuple('Possibility', ['start', 'size'])
VOID_TOKEN = '--'


class Grid:
    """Puzzle grid data (size, area numbers, solution)."""

    def __init__(self, size, areas, values=None, active_mask=None):
        self.size = Size(*size)
        self.areas = areas
        self.cells = values if values is not None else np.zeros(self.size, dtype=int)
        if active_mask is not None and active_mask.shape != self.size:
            raise ValueError('Active mask shape does not match grid size')
        mask = active_mask if active_mask is not None else np.ones(self.size, dtype=bool)
        self.active_mask = np.array(mask, dtype=bool, copy=True)

    def __copy__(self):
        return Grid(self.size, self.areas, np.copy(self.cells), np.copy(self.active_mask))


class Log:
    rec_lvl = -1

    @classmethod
    def info(cls, to_print, **kwargs):
        logging.info(f"{'|' * cls.rec_lvl}-{to_print}", **kwargs)

    @classmethod
    def debug(cls, to_print, **kwargs):
        logging.debug(f"{'|' * cls.rec_lvl}-{to_print}", **kwargs)

    @classmethod
    def store_recursion_level(cls, func):
        @wraps(func)
        def counting_wrapper(*args, **kwargs):
            cls.rec_lvl += 1
            res = func(*args, **kwargs)
            cls.rec_lvl -= 1
            return res
        return counting_wrapper


def area_info(area_coord, grid):
    """Provide area information (coordinates and size) as string."""
    return f'area {area_coord} {grid.areas[area_coord]}'


def is_cell_in_rectangle(cell_coord, possibility):
    """Verify if a cell coordinates is in a rectangle possibility."""
    return (possibility.start.y <= cell_coord.y < possibility.start.y + possibility.size.height
            and possibility.start.x <= cell_coord.x < possibility.start.x + possibility.size.width)


def covers_only_active_cells(possibility, grid):
    """Return True if the possibility does not overlap masked (void) cells."""
    end_y = possibility.start.y + possibility.size.height
    end_x = possibility.start.x + possibility.size.width
    return np.all(grid.active_mask[possibility.start.y:end_y, possibility.start.x:end_x])


def is_zone_free(p, grid):
    """Verify if the zone is free (not occupied)."""
    end_y, end_x = p.start.y + p.size.height, p.start.x + p.size.width
    if not covers_only_active_cells(p, grid):
        return False
    rectangle = grid.cells[p.start.y:end_y, p.start.x:end_x]
    free_space = rectangle[np.where(rectangle == 0)]
    return free_space.size == p.size.width * p.size.height


def is_another_area_info_in_rectangle(p, area_coord, grid):
    """Verify if the zone contains another area number."""

    def is_area_in_rect(coord):
        return p.start.y <= coord.y < end_y and p.start.x <= coord.x < end_x

    end_y, end_x = p.start.y + p.size.height, p.start.x + p.size.width
    return any((is_area_in_rect(coord) for coord in grid.areas.keys() if coord != area_coord))


def initial_possibilities_calculation(grid):
    """For each area find all possible shape dimensions and their positions."""

    def get_divisors(n):
        """Yield all divisors of a number n."""
        for i in range(1, int(math.sqrt(n)) + 1):
            if n % i == 0:
                yield (i, n // i)

    def get_available_places(area_coord, size):
        """Find all places where a given shape (length/width) can fit, including its 90° rot."""
        solutions = []
        for width, height in [size, reversed(size)]:
            for w in range(width):
                for h in range(height):
                    start_y, start_x = area_coord.y - h, area_coord.x - w
                    if (start_x >= 0 and start_y >= 0
                            and 0 < start_x + width <= grid.size.width
                            and 0 < start_y + height <= grid.size.height):
                        p = Possibility(Coord(start_y, start_x), Size(height, width))
                        if (covers_only_active_cells(p, grid)
                                and not is_another_area_info_in_rectangle(p, area_coord, grid)):
                            solutions.append(p)
            if width == height:  # if the shape is a square, do not rotate
                break
        return solutions

    initial_possibilities = {coord: [] for coord in grid.areas.keys()}
    for coord, area_size in grid.areas.items():
        for divisors in get_divisors(area_size):
            initial_possibilities[coord].extend(
                get_available_places(coord, divisors))
    return initial_possibilities


def empty_cells(grid):
    mask = np.argwhere((grid.cells == 0) & grid.active_mask)
    return (Coord(*tuple(empty_coord)) for empty_coord in mask)


def empty_cells_possibilities(remaining_possibilities, grid):
    """Get the usage of each empty cell by the areas rectangle possibilities."""

    empty_cells_usage = {coord: defaultdict(list) for coord in empty_cells(grid)}
    for area_coord, possibilities in remaining_possibilities.items():
        for p in possibilities:
            start, size = p
            for cell_y in range(start.y, start.y + size.height):
                for cell_x in range(start.x, start.x + size.width):
                    if (cell_y, cell_x) in empty_cells_usage:
                        empty_cells_usage[(cell_y, cell_x)][area_coord].append(p)
    return empty_cells_usage


def lexicographical_grid(grid):
    """Get a string representation of the 2D array grid."""
    letters = [f"{i:02d}" for i in range(100)]
    ascii_solution = []
    i_letter = 0
    rectangles_letter = {}
    flattened_cells = np.reshape(grid.cells, grid.size.height * grid.size.width)
    flattened_mask = np.reshape(grid.active_mask, grid.size.height * grid.size.width)
    for cell, is_active in zip(flattened_cells, flattened_mask):
        if not is_active:
            ascii_solution.append(VOID_TOKEN)
            continue
        if cell not in rectangles_letter.keys():
            rectangles_letter[cell] = letters[i_letter % len(letters)]
            i_letter += 1
        ascii_solution.append(rectangles_letter[cell])
    return ''.join(ascii_solution)


def get_from_cache(grid, cached_results, rectangle_counter):
    """Find in the cache all solutions that can fill the given empty grid situation."""
    solutions = set()
    zeros_coords = np.where((grid.cells == 0) & grid.active_mask)
    for cached_result in cached_results:
        cached_array = np.array([int(cached_result[i:i+2]) for i in range(0, len(cached_result), 2)]).reshape(
            grid.size.height, grid.size.width) + next(rectangle_counter)
        grid.cells[zeros_coords] = cached_array[zeros_coords]
        solutions.add(lexicographical_grid(grid))
    return solutions


def get_assumed_possibilities_from_an_area(remaining_possibilities):
    """Select an area candidate and yield the remaining possibilities after making a guess."""

    def get_an_area_candidate(all_possibilities):
        """Find the area with the less possibilities and the biggest shape."""
        min_n_possibilities = len(min(all_possibilities.values(), key=lambda x: (len(x))))
        min_keys = [coord for coord, poss in all_possibilities.items()
                    if len(poss) == min_n_possibilities]
        return max(min_keys, key=lambda k: max(map(lambda x: mul(*x[1]), all_possibilities[k])))

    candidate_coord = get_an_area_candidate(remaining_possibilities)  # select an area candidate
    # run over on the all candidate's possibilities (in case of multiple correct solutions)
    for rect_possibility in remaining_possibilities[candidate_coord]:
        assumed_possibilities = remaining_possibilities
        assumed_possibilities[candidate_coord] = [rect_possibility]  # select one candidate's possibility (one shape)
        yield assumed_possibilities, rect_possibility
