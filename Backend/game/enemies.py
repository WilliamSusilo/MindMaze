from .state import Enemy, GameState, Difficulty
from game.maze import can_move


def move_enemies(state: GameState) -> None:
    # If difficulty is IMPOSSIBLE, moving enemies are disabled (map memorization mode)
    try:
        if state.difficulty == Difficulty.IMPOSSIBLE:
            return
    except Exception:
        pass
    for enemy in state.enemies:
        if not enemy.alive:
            continue

        nx = enemy.x + enemy.dx
        ny = enemy.y + enemy.dy

        # reverse direction if blocked
        if not can_move(state.maze, nx, ny):
            enemy.dx *= -1
            enemy.dy *= -1
            nx = enemy.x + enemy.dx
            ny = enemy.y + enemy.dy

        # move enemy if possible
        if can_move(state.maze, nx, ny):
            enemy.x = nx
            enemy.y = ny

        # collision with player
        if enemy.x == state.player.x and enemy.y == state.player.y and enemy.alive:
            # apply damage based on difficulty
            if state.difficulty in (Difficulty.MEDIUM, Difficulty.IMPOSSIBLE):
                # In NORMAL (MEDIUM) and IMPOSSIBLE difficulties, colliding with an enemy causes immediate game over
                print(f"[ENEMY] collision {getattr(state,'difficulty',None)} -> immediate GAME_OVER: game={getattr(state,'game_id',None)}")
                state.is_game_over = True
            else:
                # On other difficulties (easy/impossible), subtract health
                state.player.health = max(0, state.player.health - 15)
                print(f"[ENEMY] collision non-MEDIUM: game={getattr(state,'game_id',None)} health={state.player.health}")

            # mark player hit for front-end feedback
            setattr(state, "player_hit", True)

            # optionally kill or disable enemy for a moment
            # enemy.alive = False
