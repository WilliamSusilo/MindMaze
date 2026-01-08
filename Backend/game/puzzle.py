from game.state import GameState


def solve_puzzle(state: GameState, correct: bool) -> GameState:
    if correct:
        state.score += 50
        state.player.energy += 10
    else:
        state.player.health -= 10

    return state
