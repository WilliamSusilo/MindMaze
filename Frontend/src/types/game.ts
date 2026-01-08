// src/types/game.ts

export type Difficulty = "easy" | "normal" | "impossible";
export type GamePhase = "menu" | "playing" | "paused" | "gameOver" | "victory";

export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  position: Position;
}

export interface Item {
  type: string;
  uses: number;
}

export interface PuzzleState {
  sequence: string[];
  progress: string[];
}

export interface GameState {
  game_id: string;
  phase: GamePhase;
  difficulty: Difficulty;
  level: number;
  maze: number[][];
  player_position: Position;
  playerPosition?: Position;

  energy: number;
  health: number;
  lives?: number;
  keys_required?: number;
  keys_collected?: number;
  time_left: number;
  score: number;

  enemies: Enemy[];
  items: Item[];

  map_visible?: boolean;
  mapTimer?: number;
  map_visible_alias?: boolean;

  puzzle: PuzzleState | null;
}
