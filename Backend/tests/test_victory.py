import pytest
from game.state import GameState, Player, Difficulty
from game.victory import check_victory


def make_state(difficulty=Difficulty.MEDIUM, time_left=100, health=100, energy=50, maze_size=8, player_pos=(7,7), keys_required=0, keys_collected=0):
    # simple maze containing exit at bottom-right
    maze = [[0 for _ in range(maze_size)] for _ in range(maze_size)]
    maze[maze_size-1][maze_size-1] = 2
    state = GameState(
        game_id="test",
        difficulty=difficulty,
        player=Player(x=player_pos[0], y=player_pos[1], health=health, energy=energy, lives=1),
        enemies=[],
        maze=maze,
        time_left=time_left,
        score=0,
        inventory={},
        level=1,
        is_game_over=False,
        is_victory=False,
        lives=1,
        keys_required=keys_required,
        keys_collected=keys_collected,
    )
    return state


def test_victory_on_reach_exit_medium():
    s = make_state(difficulty=Difficulty.MEDIUM, time_left=120, health=80, energy=40)
    check_victory(s)
    assert s.is_victory is True
    assert s.is_game_over is True
    assert 0 <= s.score <= 100


def test_no_false_game_over_when_values_positive():
    s = make_state(difficulty=Difficulty.MEDIUM, time_left=50, health=90, energy=40)
    # ensure not game over beforehand
    assert not s.is_game_over
    check_victory(s)
    assert s.is_victory is True
    assert s.is_game_over is True


def test_score_scaling_easy():
    s = make_state(difficulty=Difficulty.EASY, time_left=120, health=100, energy=50)
    check_victory(s)
    assert s.score == 100


def test_score_scaling_worse_stats():
    s = make_state(difficulty=Difficulty.IMPOSSIBLE, time_left=0, health=50, energy=10)
    check_victory(s)
    assert s.is_game_over is True
    # score should be computed and within 0-100
    assert 0 <= s.score <= 100
