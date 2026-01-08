from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.game_manager import create_game, get_game, serialize_state
from game.actions import (
    move_player,
    apply_item,
    apply_puzzle_result,
    apply_tick,
)
from game.state import Difficulty
from schemas import (
    MoveRequest,
    ItemRequest,
    PuzzleRequest,
    TickRequest,
    StartRequest,
)

app = FastAPI()

# Allow CORS from frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/game/start")
def start_game(req: StartRequest):
    # convert difficulty string to enum; accept frontend's "normal" -> MEDIUM
    val = (req.difficulty or "").lower()
    if val == "easy":
        diff = Difficulty.EASY
    elif val in ("normal", "medium"):
        diff = Difficulty.MEDIUM
    elif val in ("hard", "impossible"):
        diff = Difficulty.IMPOSSIBLE
    else:
        diff = Difficulty.EASY

    # allow client to pass desired level for progression
    lvl = getattr(req, "level", 1) or 1
    state = create_game(diff, level=lvl)
    return serialize_state(state)


@app.post("/game/move")
def move(req: MoveRequest):
    state = get_game(req.game_id)
    new_state = move_player(state, req.dx, req.dy)
    return serialize_state(new_state)


@app.post("/game/use-item")
def use_item(req: ItemRequest):
    state = get_game(req.game_id)
    new_state = apply_item(state, req.item_id)
    return serialize_state(new_state)


@app.post("/game/puzzle")
def puzzle(req: PuzzleRequest):
    state = get_game(req.game_id)
    new_state = apply_puzzle_result(state, req.correct)
    return serialize_state(new_state)


@app.post("/game/tick")
def tick(req: TickRequest):
    state = get_game(req.game_id)
    new_state = apply_tick(state)
    return serialize_state(new_state)


@app.get("/game/state/{game_id}")
def get_state(game_id: str):
    state = get_game(game_id)
    return serialize_state(state)

