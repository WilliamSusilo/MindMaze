from game.state import GameState
from game.rules import can_use_item


def use_item(state: GameState, item_id: str) -> GameState:
    if not can_use_item(state, item_id):
        return state

    if item_id == "health_potion":
        state.player.health = min(100, state.player.health + 30)

    elif item_id == "energy_boost":
        state.player.energy += 20

    state.inventory[item_id] -= 1
    if state.inventory[item_id] <= 0:
        del state.inventory[item_id]

    return state
