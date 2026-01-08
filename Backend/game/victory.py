# win / lose logic
from .state import GameState, Difficulty


def check_victory(state: GameState) -> None:
    # Determine exit position from the maze if present, otherwise fall back to bottom-right
    exit_pos = None
    try:
        for y, row in enumerate(state.maze):
            for x, cell in enumerate(row):
                if cell == 2:
                    exit_pos = (x, y)
                    break
            if exit_pos:
                break
    except Exception:
        exit_pos = None

    if not exit_pos:
        size = len(state.maze) if getattr(state, "maze", None) else 0
        exit_pos = (max(0, size - 1), max(0, size - 1))

    at_exit = (state.player.x, state.player.y) == exit_pos

    # Finish should end the game when the player reaches the exit (match Easy behavior)
    if at_exit:
        # require keys to be collected before allowing victory
        required = getattr(state, "keys_required", 0) or 0
        collected = getattr(state, "keys_collected", 0) or 0
        if required > collected:
            print(f"[VICTORY] Exit reached but keys missing: game={getattr(state,'game_id',None)} collected={collected}/{required}")
            # do not set victory yet
            return
        # compute final score using weighted indicators: Time:Health:Energy = 4:3:3
        try:
            # map difficulty to starting time (matches create_game)
            if getattr(state, "difficulty", None) == Difficulty.EASY:
                initial_time = 120
            elif getattr(state, "difficulty", None) == Difficulty.MEDIUM:
                initial_time = 180
            else:
                initial_time = 150

            time_left = max(0, getattr(state, "time_left", 0) or 0)
            time_pct = min(1.0, time_left / float(initial_time)) if initial_time > 0 else 0.0

            hp = max(0, getattr(state.player, "health", 0) or 0)
            hp_pct = min(1.0, hp / 100.0)

            en = max(0, getattr(state.player, "energy", 0) or 0)
            # energy max is 50 as set in create_game
            en_pct = min(1.0, en / 50.0)

            weighted = (time_pct * 4.0) + (hp_pct * 3.0) + (en_pct * 3.0)
            score_val = (weighted / 10.0) * 100.0
            final_score = int(round(max(0, min(100, score_val))))
            state.score = final_score
        except Exception:
            try:
                state.score = 0
            except Exception:
                pass

        print(f"[VICTORY] Game {getattr(state,'game_id',None)} reached exit at {at_exit}; score={state.score}")
        state.is_victory = True
        state.is_game_over = True

    # Lose conditions: only when values are actually zero or below
    try:
        hp = getattr(state.player, "health", None)
        en = getattr(state.player, "energy", None)
        tl = getattr(state, "time_left", None)
        lv = getattr(state, "lives", None)
    except Exception:
        hp = en = tl = lv = None

    if (hp is not None and hp <= 0) or (tl is not None and tl <= 0) or (lv is not None and lv <= 0) or (en is not None and en <= 0):
        reasons = []
        if hp is not None and hp <= 0:
            reasons.append(f"health={hp}")
        if en is not None and en <= 0:
            reasons.append(f"energy={en}")
        if tl is not None and tl <= 0:
            reasons.append(f"time_left={tl}")
        if lv is not None and lv <= 0:
            reasons.append(f"lives={lv}")
        print(f"[GAME_OVER] Game {getattr(state,'game_id',None)} triggered by: {', '.join(reasons)}")
        state.is_game_over = True
