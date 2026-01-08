# aturan & validasi
from game.state import GameState


def can_player_move(state: GameState) -> bool:
    if state.is_game_over:
        return False
    if state.player.energy <= 0:
        return False
    # During Impossible difficulty map preview/countdown, player cannot move
    if getattr(state, "difficulty", None) is not None:
        try:
            from game.state import Difficulty
            if state.difficulty == Difficulty.IMPOSSIBLE and getattr(state, "map_preview_time", 0) > 0:
                return False
        except Exception:
            pass
    return True


def can_use_item(state: GameState, item_id: str) -> bool:
    if state.is_game_over:
        return False
    return state.inventory.get(item_id, 0) > 0


def can_solve_puzzle(state: GameState) -> bool:
    if state.is_game_over:
        return False
    return True


def tick_allowed(state: GameState) -> bool:
    return not state.is_game_over
