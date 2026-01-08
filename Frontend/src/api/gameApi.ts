import { GameState, Difficulty } from "../types/game";

const BASE_URL = "http://127.0.0.1:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const gameApi = {
  startGame(difficulty: Difficulty, level?: number): Promise<GameState> {
    const body: any = { difficulty };
    if (typeof level === "number") body.level = level;
    return request("/game/start", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  move(gameId: string, dxOrDir: number | string, dy?: number): Promise<GameState> {
    // Allow calling with direction string ('up','down','left','right')
    let dx = 0;
    let dyVal = 0;

    if (typeof dxOrDir === "string") {
      switch (dxOrDir) {
        case "up":
          dx = 0;
          dyVal = -1;
          break;
        case "down":
          dx = 0;
          dyVal = 1;
          break;
        case "left":
          dx = -1;
          dyVal = 0;
          break;
        case "right":
          dx = 1;
          dyVal = 0;
          break;
        default:
          dx = 0;
          dyVal = 0;
      }
    } else {
      dx = dxOrDir;
      dyVal = dy ?? 0;
    }

    return request("/game/move", {
      method: "POST",
      body: JSON.stringify({ game_id: gameId, dx, dy: dyVal }),
    });
  },

  useItem(gameId: string, itemId: string): Promise<GameState> {
    return request("/game/use-item", {
      method: "POST",
      body: JSON.stringify({ game_id: gameId, item_id: itemId }),
    });
  },

  puzzle(gameId: string, correct: boolean): Promise<GameState> {
    return request("/game/puzzle", {
      method: "POST",
      body: JSON.stringify({ game_id: gameId, correct }),
    });
  },

  tick(gameId: string): Promise<GameState> {
    return request("/game/tick", {
      method: "POST",
      body: JSON.stringify({ game_id: gameId }),
    });
  },

  getState(gameId: string): Promise<GameState> {
    return request(`/game/state/${gameId}`);
  },
};
