from game.state import GameState
from game.rules import tick_allowed
from game.victory import check_victory


def tick(state: GameState) -> GameState:
    if not tick_allowed(state):
        return state

    state.time_left -= 1
    # decrement map preview timer if present (used for Impossible preview)
    if getattr(state, "map_preview_time", 0) > 0:
        try:
            state.map_preview_time = max(0, state.map_preview_time - 1)
        except Exception:
            pass
    check_victory(state)
    return state
