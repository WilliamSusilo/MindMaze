# logic maze
import random
from typing import Tuple


def generate_maze(size: int, difficulty: str = "easy") -> Tuple[list[list[int]], list[Tuple[int, int]], list[Tuple[int, int]], Tuple[int, int]]:
    """
    Generates a labyrinth-style maze using a randomized depth-first search (recursive backtracker).
    Cell values:
    0 = path, 1 = wall, 2 = exit, 3 = start, 4 = trap, 5 = key

    Returns (maze, traps, keys, exit_pos)
    """
    # normalize size to odd and minimum to allow proper corridors
    if size < 5:
        size = 5
    if size % 2 == 0:
        size += 1

    w = h = size
    maze = [[1 for _ in range(w)] for _ in range(h)]

    # carve passages on odd coordinates
    def carve(cx: int, cy: int):
        dirs = [(2, 0), (-2, 0), (0, 2), (0, -2)]
        random.shuffle(dirs)
        for dx, dy in dirs:
            nx, ny = cx + dx, cy + dy
            if 1 <= nx < w - 1 and 1 <= ny < h - 1 and maze[ny][nx] == 1:
                # remove wall between
                maze[cy + dy // 2][cx + dx // 2] = 0
                maze[ny][nx] = 0
                carve(nx, ny)

    # start carving from (1,1)
    maze[1][1] = 0
    carve(1, 1)

    # set start and exit positions (near corners)
    start_pos = (1, 1)
    exit_pos = (w - 2, h - 2)
    maze[start_pos[1]][start_pos[0]] = 3
    maze[exit_pos[1]][exit_pos[0]] = 2

    # trap probability by difficulty
    trap_prob = 0.03 if difficulty == "easy" else 0.06 if difficulty == "medium" else 0.08

    traps: list[Tuple[int, int]] = []
    keys: list[Tuple[int, int]] = []

    # collect all path cells for placing traps/keys
    path_cells: list[Tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if maze[y][x] == 0:
                path_cells.append((x, y))

    # add some extra openings to create loops/alternate routes (not a perfect maze)
    # factor determines how many extra openings to create per difficulty
    # make Impossible the most twisty by adding the fewest extra openings;
    # Easy should have more alternative routes so it's less linear.
    factor = 0.08 if difficulty == "easy" else 0.04 if difficulty == "medium" else 0.01
    extra_openings = max(1, int(len(path_cells) * factor))
    wall_candidates = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if maze[y][x] == 1:
                # count adjacent path neighbors
                adj = 0
                for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if maze[y + oy][x + ox] != 1:
                        adj += 1
                # prefer walls between multiple path cells to create meaningful loops
                if adj >= 2:
                    wall_candidates.append((x, y))
    random.shuffle(wall_candidates)
    opened = 0
    for (wx, wy) in wall_candidates:
        if opened >= extra_openings:
            break
        # avoid opening start/exit
        if (wx, wy) in (start_pos, exit_pos):
            continue
        maze[wy][wx] = 0
        opened += 1

    # refresh path_cells after openings
    path_cells = [(x, y) for y in range(h) for x in range(w) if maze[y][x] == 0]

    # place traps on some path cells (but not on start/exit)
    for (x, y) in list(path_cells):
        if (x, y) in (start_pos, exit_pos):
            continue
        if random.random() < trap_prob:
            maze[y][x] = 4
            traps.append((x, y))

    # place a single key on a reachable path cell that is NOT on the direct shortest path
    # from start -> exit; prefer positions far from the exit so player must traverse
    # additional convoluted corridors to reach the exit after collecting the key.
    reachable = set()
    from collections import deque

    q = deque([start_pos])
    reachable.add(start_pos)
    while q:
        cx, cy = q.popleft()
        for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + ox, cy + oy
            if 0 <= nx < w and 0 <= ny < h and maze[ny][nx] != 1 and (nx, ny) not in reachable:
                reachable.add((nx, ny))
                q.append((nx, ny))

    # compute shortest path start->exit to avoid placing key on that direct path
    def shortest_path(s, t):
        from collections import deque
        q = deque([s])
        prev = {s: None}
        while q:
            cur = q.popleft()
            if cur == t:
                # reconstruct
                path = []
                c = t
                while c is not None:
                    path.append(c)
                    c = prev.get(c)
                path.reverse()
                return path
            cx, cy = cur
            for ox, oy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = cx+ox, cy+oy
                if 0 <= nx < w and 0 <= ny < h and maze[ny][nx] != 1 and (nx, ny) not in prev:
                    prev[(nx, ny)] = cur
                    q.append((nx, ny))
        return None

    direct = set()
    sp = shortest_path(start_pos, exit_pos)
    if sp:
        direct.update(sp)

    candidates = [pos for pos in reachable if pos not in (start_pos, exit_pos) and maze[pos[1]][pos[0]] == 0 and pos not in direct]

    # if no candidates outside the direct path, fall back to any reachable non-start/exit
    if not candidates:
        candidates = [pos for pos in reachable if pos not in (start_pos, exit_pos) and maze[pos[1]][pos[0]] == 0]

    if candidates:
        # compute BFS distances from exit to prefer far locations
        from collections import deque
        dist = {exit_pos: 0}
        q = deque([exit_pos])
        while q:
            cx, cy = q.popleft()
            for ox, oy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = cx+ox, cy+oy
                if 0 <= nx < w and 0 <= ny < h and maze[ny][nx] != 1 and (nx, ny) not in dist:
                    dist[(nx, ny)] = dist[(cx, cy)] + 1
                    q.append((nx, ny))

        # sort candidates by distance descending and pick from top choices
        candidates.sort(key=lambda p: dist.get(p, 0), reverse=True)
        top_count = max(1, int(len(candidates) * 0.2))
        choice = random.choice(candidates[:top_count])
        kx, ky = choice
        maze[ky][kx] = 5
        keys.append((kx, ky))

    return maze, traps, keys, exit_pos


def can_move(maze, x: int, y: int) -> bool:
    size = len(maze)
    if x < 0 or y < 0 or x >= size or y >= size:
        return False
    return maze[y][x] != 1
