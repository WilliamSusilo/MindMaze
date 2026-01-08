import uuid
from game.state import GameState, Player, Difficulty, Enemy
from game.maze import generate_maze
from core.storage import GAMES


def create_game(difficulty: Difficulty, level: int = 1) -> GameState:
    game_id = str(uuid.uuid4())
    # size and parameters by difficulty
    if difficulty == Difficulty.EASY:
        size = 8
        time_left = 120
        lives = 3
        # Require key for all difficulties
        keys_required = 1
        darkness = False
    elif difficulty == Difficulty.MEDIUM:
        size = 12
        time_left = 180
        lives = 3
        keys_required = 1
        darkness = False
    elif difficulty == Difficulty.IMPOSSIBLE:
        size = 8
        time_left = 150
        lives = 5
        keys_required = 1
        darkness = True

    maze, traps, keys, exit_pos = generate_maze(size, difficulty.value)

    # determine player start from generated maze (cell 3) if present
    start_x, start_y = 0, 0
    try:
        for y, row in enumerate(maze):
            for x, cell in enumerate(row):
                if cell == 3:
                    start_x, start_y = x, y
                    raise StopIteration
    except StopIteration:
        pass

    # starting energy: Normal (MEDIUM) gets full 100 energy; others keep previous defaults
    starting_energy = 100 if difficulty == Difficulty.MEDIUM else 50

    state = GameState(
        game_id=game_id,
        difficulty=difficulty,
        maze=maze,
        player=Player(x=start_x, y=start_y, health=100, energy=starting_energy, lives=lives),
        enemies=[],
        time_left=time_left,
        score=0,
        inventory={},
        lives=lives,
        keys_required=keys_required,
        keys_collected=0,
        traps=traps,
        darkness=darkness,
        map_preview_time=5 if difficulty == Difficulty.IMPOSSIBLE else 0,
        level=level,
    )
    # spawn enemies for medium (moving enemies). For Impossible we remove moving enemies (only static traps remain)
    import random
    enemies = []
    if difficulty == Difficulty.MEDIUM:
        num_enemies = 2
    elif difficulty == Difficulty.IMPOSSIBLE:
        # Do not spawn moving enemies on IMPOSSIBLE; player must memorise arena instead
        num_enemies = 0
    else:
        num_enemies = 0

    size = len(maze)
    # avoid placing enemies on start cell and on the exit cell
    exit_coords = tuple(exit_pos) if exit_pos else (size-1, size-1)
    empty_cells = [(x, y) for y in range(size) for x in range(size) if maze[y][x] == 0 and (x, y) not in [(start_x, start_y), exit_coords]]
    random.shuffle(empty_cells)
    # Avoid placing enemies on critical paths (start->key and key->exit) if possible
    critical = set()
    try:
        # compute shortest path helper
        from collections import deque

        def shortest_path(sx, sy, tx, ty):
            q = deque([(sx, sy)])
            prev = { (sx, sy): None }
            while q:
                cx, cy = q.popleft()
                if (cx, cy) == (tx, ty):
                    # reconstruct
                    path = []
                    cur = (tx, ty)
                    while cur is not None:
                        path.append(cur)
                        cur = prev.get(cur)
                    path.reverse()
                    return path
                for ox, oy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = cx+ox, cy+oy
                    if 0 <= nx < size and 0 <= ny < size and maze[ny][nx] != 1 and (nx, ny) not in prev:
                        prev[(nx, ny)] = (cx, cy)
                        q.append((nx, ny))
            return None

        # find key position (first cell with value 5)
        key_pos = None
        for y, row in enumerate(maze):
            for x, cell in enumerate(row):
                if cell == 5:
                    key_pos = (x, y)
                    break
            if key_pos:
                break

        # always include the shortest path from start -> exit as critical
        p0 = shortest_path(start_x, start_y, exit_coords[0], exit_coords[1])
        if p0:
            critical.update(p0)

        if key_pos:
            p1 = shortest_path(start_x, start_y, key_pos[0], key_pos[1])
            p2 = shortest_path(key_pos[0], key_pos[1], exit_coords[0], exit_coords[1])
            if p1:
                critical.update(p1)
            if p2:
                critical.update(p2)
    except Exception:
        critical = set()

    # choose enemy spawn cells avoiding critical path cells when possible
    spawn_cells = [c for c in empty_cells if c not in critical]
    if len(spawn_cells) < num_enemies:
        spawn_cells = empty_cells

    for i in range(min(num_enemies, len(spawn_cells))):
        x, y = spawn_cells[i]
        # random patrol direction
        if random.random() < 0.5:
            dx, dy = 1, 0
        else:
            dx, dy = 0, 1
        enemies.append(Enemy(id=str(uuid.uuid4()), x=x, y=y, pattern="patrol", dx=dx, dy=dy))

    state.enemies = enemies

    # place keys count
    GAMES[game_id] = state
    return state


def get_game(game_id: str) -> GameState:
    return GAMES[game_id]


def serialize_state(state: GameState) -> dict:
    # Map backend GameState to frontend-friendly shape
    phase = "playing"
    if state.is_victory:
        phase = "victory"
    elif state.is_game_over:
        phase = "gameOver"

    enemies = [
        {"id": e.id, "position": {"x": e.x, "y": e.y}} for e in state.enemies
    ]

    items = [{"type": k, "uses": v} for k, v in state.inventory.items()]

    # normalize difficulty to frontend expected values
    diff_val = state.difficulty.value if hasattr(state.difficulty, "value") else str(state.difficulty)
    if diff_val == "medium":
        diff_val = "normal"

    player_hit_flag = getattr(state, "player_hit", False)
    try:
        setattr(state, "player_hit", False)
    except Exception:
        pass

    return {
        "game_id": state.game_id,
        "phase": phase,
        "difficulty": diff_val,
        "level": getattr(state, "level", 1),
        "maze": state.maze,
        "player_position": {"x": state.player.x, "y": state.player.y},
        "energy": state.player.energy,
        "health": state.player.health,
        "lives": state.lives,
        "keys_required": state.keys_required,
        "keys_collected": state.keys_collected,
        "time_left": state.time_left,
        "score": state.score,
        "enemies": enemies,
        "items": items,
        # map is visible if darkness is disabled (easy/medium) or when a preview time is running (Impossible preview)
        "map_visible": (not getattr(state, "darkness", False)) or (getattr(state, "map_preview_time", 0) > 0),
        "map_timer": state.map_preview_time,
        "puzzle": getattr(state, "puzzle", None),
        "player_hit": player_hit_flag,
    }
    # clear transient flag
    try:
        setattr(state, "player_hit", False)
    except Exception:
        pass
