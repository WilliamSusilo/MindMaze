from game.state import GameState, Player, Difficulty
from game.rules import can_player_move, can_use_item
from game.maze import can_move
from game.enemies import move_enemies
from game.victory import check_victory
from game.items import use_item
from game.puzzle import solve_puzzle
from game.timer import tick


def _damage_player_on_collision(state: GameState):
    # apply damage/life logic
    # On MEDIUM (normal) difficulty, reduce player's health instead of removing a life
    if state.difficulty == Difficulty.MEDIUM:
        state.player.health -= 10
        print(f"[DAMAGE] Collision in MEDIUM: game={getattr(state,'game_id',None)} health={state.player.health}")
    else:
        # For other difficulties keep existing behavior (reduce health)
        state.player.health -= 10
        print(f"[DAMAGE] Collision in non-MEDIUM: game={getattr(state,'game_id',None)} health={state.player.health}")
    if state.lives <= 0 or state.player.lives <= 0 or state.player.health <= 0:
        print(f"[GAME_OVER] Collision caused game over: game={getattr(state,'game_id',None)} lives={state.lives} player.lives={state.player.lives} health={state.player.health}")
        state.is_game_over = True


def move_player(state: GameState, dx: int, dy: int) -> GameState:
    if not can_player_move(state):
        return state

    nx = state.player.x + dx
    ny = state.player.y + dy

    # Out of bounds or wall
    size = len(state.maze)
    if nx < 0 or ny < 0 or nx >= size or ny >= size:
        return state

    cell = state.maze[ny][nx]

    if cell == 1:
        # hit wall
        if state.difficulty == Difficulty.MEDIUM:
            _damage_player_on_collision(state)
        return state

    # Move into cell
    state.player.x = nx
    state.player.y = ny
    state.player.energy = max(0, state.player.energy - 1)

    # Check traps
    if cell == 4:
        # trap: reduce health/lives
        if state.difficulty == Difficulty.IMPOSSIBLE:
            state.player.health -= 20
        else:
            state.player.health -= 10

    # Check key
    if cell == 5:
        state.keys_collected = (state.keys_collected or 0) + 1
        # remove key from maze
        state.maze[ny][nx] = 0

    move_enemies(state)
    check_victory(state)
    return state


def apply_item(state: GameState, item_id: str) -> GameState:
    return use_item(state, item_id)


def apply_puzzle_result(state: GameState, correct: bool) -> GameState:
    return solve_puzzle(state, correct)


def apply_tick(state: GameState) -> GameState:
    # on each tick, advance enemies then timer
    try:
        move_enemies(state)
    except Exception:
        pass

    new_state = tick(state)
    return new_state
