# representasi state game
from dataclasses import dataclass, field
from typing import List, Tuple, Dict
from enum import Enum


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    IMPOSSIBLE = "impossible"


@dataclass
class Player:
    x: int
    y: int
    health: int
    energy: int
    lives: int = 3


@dataclass
class Enemy:
    id: str
    x: int
    y: int
    pattern: str
    dx: int = 1
    dy: int = 0
    alive: bool = True


@dataclass
class GameState:
    game_id: str
    difficulty: Difficulty
    player: Player
    enemies: List[Enemy]
    maze: List[List[int]]
    time_left: int
    score: int
    inventory: Dict[str, int]
    level: int = 1
    is_game_over: bool = False
    is_victory: bool = False
    lives: int = 3
    keys_required: int = 0
    keys_collected: int = 0
    traps: List[Tuple[int, int]] = field(default_factory=list)
    darkness: bool = False
    map_preview_time: int = 0
