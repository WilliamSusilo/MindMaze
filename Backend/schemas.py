# request/response model
from pydantic import BaseModel


class MoveRequest(BaseModel):
    game_id: str
    dx: int
    dy: int


class ItemRequest(BaseModel):
    game_id: str
    item_id: str


class PuzzleRequest(BaseModel):
    game_id: str
    correct: bool


class TickRequest(BaseModel):
    game_id: str


class StartRequest(BaseModel):
    difficulty: str
    level: int = 1
