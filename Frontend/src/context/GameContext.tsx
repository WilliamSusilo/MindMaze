import * as React from "react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Difficulty } from "../types/game";
import { gameApi } from "../api/gameApi";
// Audio assets (Vite will bundle these)
import MenuSrc from "../sound/Menu.mp3";
import GameSrc from "../sound/Game.mp3";
import VictorySrc from "../sound/Victory.mp3";
import LoseSrc from "../sound/Lose.mp3";

// Helper to normalize API state to frontend-friendly shape
function normalizeApiState(apiState: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!apiState) return null;

  const asRec = apiState as Record<string, unknown>;

  const getNumber = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);

  const extractPosition = (v: unknown) => {
    if (typeof v === "object" && v !== null) {
      const o = v as Record<string, unknown>;
      return { x: getNumber(o.x), y: getNumber(o.y) };
    }
    return null;
  };

  const playerPosition = extractPosition(asRec.player_position) ?? extractPosition(asRec.playerPosition) ?? { x: 0, y: 0 };

  const mapVisibleRaw = asRec.map_visible ?? asRec.mapVisible;
  const mapVisible = typeof mapVisibleRaw === "boolean" ? mapVisibleRaw : false;

  const mapTimerRaw = asRec.map_timer ?? asRec.mapTimer;
  const mapTimer = typeof mapTimerRaw === "number" ? mapTimerRaw : 0;

  const timeRaw = asRec.time_left ?? asRec.time;
  const time = typeof timeRaw === "number" ? timeRaw : 0;

  const enemiesRaw = asRec.enemies;
  const enemies = Array.isArray(enemiesRaw)
    ? enemiesRaw.map((el) => {
        if (typeof el === "object" && el !== null) {
          const obj = el as Record<string, unknown>;
          const id = typeof obj.id === "string" || typeof obj.id === "number" ? obj.id : undefined;
          const pos = extractPosition(obj.position) ?? extractPosition({ x: obj.x, y: obj.y }) ?? { x: 0, y: 0 };
          return { id, position: pos };
        }
        return { id: undefined, position: { x: 0, y: 0 } };
      })
    : [];

  const puzzle = asRec.puzzle ?? null;
  const flashlightActive = typeof asRec.flashlightActive === "boolean" ? asRec.flashlightActive : false;
  const compassActive = typeof asRec.compassActive === "boolean" ? asRec.compassActive : false;
  const isTimeFrozen = typeof asRec.isTimeFrozen === "boolean" ? asRec.isTimeFrozen : false;

  return {
    ...asRec,
    playerPosition,
    player_position: asRec.player_position ?? playerPosition,
    mapVisible,
    mapVisibleAlias: mapVisible,
    mapTimer,
    time,
    time_left: asRec.time_left ?? time,
    enemies,
    currentPuzzle: puzzle,
    showPuzzle: !!puzzle,
    flashlightActive,
    compassActive,
    isTimeFrozen,
  };
}

/**
 * ========================
 * CONTEXT SHAPE
 * ========================
 */

type NormalizedState = Record<string, unknown> | null;

type Progress = {
  unlocked: Record<string, number[]>;
  bestTimes: Record<string, number>;
  bestScores: Record<string, number>;
};

interface GameContextValue {
  state: NormalizedState;
  setState: (state: NormalizedState) => void;
  reset: () => void;
  dispatch: (action: { type: string; payload?: unknown }) => Promise<void>;
  progress: Progress;
  unlockLevel: (lvl: number, difficulty?: string) => void;
  bgmMuted?: boolean;
  toggleBgm?: () => void;
}

/**
 * ========================
 * CONTEXT
 * ========================
 */

const GameContext = createContext<GameContextValue | null>(null);

/**
 * ========================
 * PROVIDER
 * ========================
 */

export function GameProvider({ children }: { children: ReactNode }) {
  const defaultState: Record<string, unknown> = {
    game_id: "",
    phase: "menu",
    difficulty: "",
    level: 1,
    maze: [],
    player_position: { x: 0, y: 0 },
    playerPosition: { x: 0, y: 0 },
    energy: 100,
    health: 100,
    time: 300,
    time_left: 300,
    score: 0,
    enemies: [],
    // items removed from frontend UI
    mapVisible: false,
    mapTimer: 0,
    currentPuzzle: null,
    showPuzzle: false,
    flashlightActive: false,
    compassActive: false,
    isTimeFrozen: false,
  };

  const [state, setStateRaw] = useState<Record<string, unknown>>(defaultState);

  // Audio refs
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRef = useRef<HTMLAudioElement | null>(null);

  // Background music mute state
  const [bgmMuted, setBgmMuted] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("mindmaze_bgm_muted");
      return raw === "1";
    } catch {
      return false;
    }
  });

  const toggleBgm = () => {
    setBgmMuted((v) => {
      const next = !v;
      try {
        localStorage.setItem("mindmaze_bgm_muted", next ? "1" : "0");
      } catch (err) {
        console.debug("GameContext: localStorage.setItem failed", err);
      }
      return next;
    });
  };

  // Initialize audio elements once
  useEffect(() => {
    try {
      menuAudioRef.current = new Audio(MenuSrc);
      menuAudioRef.current.loop = true;
      menuAudioRef.current.volume = 0.5;

      gameAudioRef.current = new Audio(GameSrc);
      gameAudioRef.current.loop = true;
      gameAudioRef.current.volume = 0.5;
    } catch {
      // ignore asset load errors
      menuAudioRef.current = null;
      gameAudioRef.current = null;
    }

    // Try autoplay immediately on mount. If blocked, add a one-time
    // interaction listener to resume playback when the user first interacts.
    if (menuAudioRef.current) {
      menuAudioRef.current.play().catch(() => {
        const resume = () => {
          try {
            menuAudioRef.current?.play().catch(() => undefined);
          } finally {
            window.removeEventListener("pointerdown", resume);
            window.removeEventListener("keydown", resume);
          }
        };
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
      });
    }

    return () => {
      try {
        menuAudioRef.current?.pause();
        menuAudioRef.current = null;
        gameAudioRef.current?.pause();
        gameAudioRef.current = null;
        sfxAudioRef.current = null;
      } catch (err) {
        console.debug("GameContext: cleanup error", err);
      }
    };
  }, []);

  // Play/stop audio when phase changes
  useEffect(() => {
    const phase = state?.phase ?? "menu";

    const stopMenu = () => {
      try {
        if (menuAudioRef.current) {
          menuAudioRef.current.pause();
          menuAudioRef.current.currentTime = 0;
        }
      } catch (err) {
        console.debug("GameContext: stopMenu error", err);
      }
    };

    const stopGame = () => {
      try {
        if (gameAudioRef.current) {
          gameAudioRef.current.pause();
          gameAudioRef.current.currentTime = 0;
        }
      } catch (err) {
        console.debug("GameContext: stopGame error", err);
      }
    };

    // helper to play safely
    const safePlay = async (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      try {
        await audio.play();
      } catch {
        // autoplay may be blocked until user interacts
      }
    };

    if (phase === "menu") {
      stopGame();
      if (!bgmMuted) safePlay(menuAudioRef.current);
    } else if (phase === "victory") {
      // stop loops and play victory short SFX
      stopMenu();
      stopGame();
      try {
        sfxAudioRef.current = new Audio(VictorySrc);
        sfxAudioRef.current.loop = false;
        sfxAudioRef.current.volume = 0.8;
        safePlay(sfxAudioRef.current);
      } catch (err) {
        console.debug("GameContext: victory SFX failed", err);
      }
    } else if (phase === "gameOver" || phase === "game_over") {
      stopMenu();
      stopGame();
      try {
        sfxAudioRef.current = new Audio(LoseSrc);
        sfxAudioRef.current.loop = false;
        sfxAudioRef.current.volume = 0.8;
        safePlay(sfxAudioRef.current);
      } catch (err) {
        console.debug("GameContext: lose SFX failed", err);
      }
    } else {
      // assume any non-menu, non-terminal phase is in-game
      stopMenu();
      if (!bgmMuted) safePlay(gameAudioRef.current);
    }
  }, [state?.phase, bgmMuted]);

  // Pause/Resume loops when mute toggles
  useEffect(() => {
    try {
      if (bgmMuted) {
        menuAudioRef.current?.pause();
        gameAudioRef.current?.pause();
      } else {
        // play whichever is appropriate for current phase
        const phase = state?.phase ?? "menu";
        if (phase === "menu") {
          menuAudioRef.current?.play().catch(() => undefined);
        } else if (phase !== "victory" && phase !== "gameOver" && phase !== "game_over") {
          gameAudioRef.current?.play().catch(() => undefined);
        }
      }
    } catch (err) {
      console.debug("GameContext: pause/resume error", err);
    }
  }, [bgmMuted, state?.phase]);

  // Load/save progression from localStorage
  const [progress, setProgress] = useState<Progress>(() => {
    try {
      const raw = localStorage.getItem("mindmaze_progress");
      return (raw ? JSON.parse(raw) : { unlocked: { easy: [1], normal: [1], impossible: [1] }, bestTimes: {}, bestScores: {} }) as Progress;
    } catch (err) {
      console.debug("GameContext: load progress failed", err);
      return { unlocked: { easy: [1], normal: [1], impossible: [1] }, bestTimes: {}, bestScores: {} };
    }
  });

  const saveProgress = (p: Progress) => {
    setProgress(p);
    try {
      localStorage.setItem("mindmaze_progress", JSON.stringify(p));
    } catch (err) {
      console.debug("GameContext: save progress failed", err);
    }
  };

  const setState = (s: unknown) => {
    if (!s) return setStateRaw(defaultState);
    // If it's an API raw state, normalize it
    const normalized = normalizeApiState(s as Record<string, unknown>) ?? (typeof s === "object" && s !== null ? (s as Record<string, unknown>) : defaultState);
    setStateRaw(normalized);

    // when victory, update progression and best times
    try {
      const normRec = normalized as Record<string, unknown>;
      const getString = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
      const getNumber = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);

      const phase = getString(normRec["phase"], "");
      if (phase === "victory") {
        const level = getNumber(normRec["level"], 1);
        const difficulty = getString(normRec["difficulty"], "normal");
        const key = `${difficulty}:${level}`;
        const timeLeft = getNumber(normRec["time_left"] ?? normRec["time"], 0);

        // update unlocked per-difficulty
        const unlocked = { ...(progress.unlocked || { easy: [1], normal: [1], impossible: [1] }) };
        const setForDiff = new Set(unlocked[difficulty] || [1]);
        // unlock next level up to 6
        const nextLevel = Math.min(6, level + 1);
        setForDiff.add(nextLevel);
        unlocked[difficulty] = Array.from(setForDiff).sort((a: number, b: number) => a - b);

        const bestTimes = { ...(progress.bestTimes || {}) };
        const prevBest = bestTimes[key] || 0;
        if (timeLeft > prevBest) bestTimes[key] = timeLeft;

        const bestScores = { ...(progress.bestScores || {}) };
        const prevScore = bestScores[key] || 0;
        const finalScore = getNumber(normRec["score"], 0);
        if (finalScore > prevScore) bestScores[key] = finalScore;

        const newProg = { unlocked, bestTimes, bestScores };
        saveProgress(newProg);
      }
    } catch {
      // ignore
    }
  };

  const reset = () => setStateRaw(defaultState);

  const dispatch = async (action: { type: string; payload?: unknown }) => {
    try {
      const getStateString = (key: string, fallback = "") => {
        const v = (state as Record<string, unknown>)?.[key];
        return typeof v === "string" ? v : fallback;
      };

      const asDifficulty = (s: string): Difficulty => (s === "easy" || s === "normal" || s === "impossible" ? (s as Difficulty) : "normal");

      const getStateNumber = (key: string, fallback = 0) => {
        const v = (state as Record<string, unknown>)?.[key];
        return typeof v === "number" ? v : fallback;
      };

      switch (action.type) {
        case "SET_DIFFICULTY":
          setStateRaw((prev) => ({ ...(prev as Record<string, unknown>), difficulty: action.payload }));
          break;

        case "START_GAME": {
          // allow starting at a specific level via action.payload.level
          let requestedLevel = 1;
          if (typeof action.payload === "object" && action.payload !== null) {
            const p = action.payload as Record<string, unknown>;
            if (typeof p.level === "number") requestedLevel = p.level;
          }
          const difficulty = asDifficulty(getStateString("difficulty", "normal"));
          const res = await gameApi.startGame(difficulty, requestedLevel);
          setState(res);
          break;
        }

        // 'USE_ITEM' removed — items/inventory UI is not used in this build

        case "COMPLETE_PUZZLE": {
          const gameId = getStateString("game_id", "");
          const res = await gameApi.puzzle(gameId, true);
          setState(res);
          break;
        }

        case "FAIL_PUZZLE": {
          const gameId = getStateString("game_id", "");
          const res = await gameApi.puzzle(gameId, false);
          setState(res);
          break;
        }

        case "TICK": {
          const gameId = getStateString("game_id", "");
          const res = await gameApi.tick(gameId);
          setState(res);
          break;
        }

        case "MOVE": {
          // payload can be direction string or {dx,dy}
          const payload = action.payload;
          const gameId = getStateString("game_id", "");
          let res;
          if (typeof payload === "string") {
            res = await gameApi.move(gameId, payload);
          } else if (typeof payload === "object" && payload !== null) {
            const p = payload as Record<string, unknown>;
            const dx = typeof p.dx === "number" ? p.dx : 0;
            const dy = typeof p.dy === "number" ? p.dy : 0;
            res = await gameApi.move(gameId, dx, dy);
          } else {
            // invalid payload; no-op
            break;
          }
          setState(res);
          break;
        }

        case "NEXT_LEVEL": {
          // increment level up to 6 per difficulty and restart with same difficulty
          const current = getStateNumber("level", 1);
          const next = Math.min(6, current + 1);
          const difficulty = asDifficulty(getStateString("difficulty", "normal"));
          const res = await gameApi.startGame(difficulty, next);
          setState(res);
          break;
        }

        case "RESET_GAME": {
          reset();
          break;
        }

        case "UNLOCK_LEVEL": {
          // payload can be a number (level) or an object { difficulty, level }
          const payload = action.payload;
          let difficulty = getStateString("difficulty", "normal");
          let lvl: number | undefined;
          if (typeof payload === "number") {
            lvl = payload;
          } else if (typeof payload === "object" && payload !== null) {
            const p = payload as Record<string, unknown>;
            if (typeof p.level === "number") lvl = p.level;
            if (typeof p.difficulty === "string") difficulty = p.difficulty;
          }
          if (typeof lvl !== "number") break;

          const unlockedMap = { ...(progress.unlocked || { easy: [1], normal: [1], impossible: [1] }) };
          const setForDiff = new Set(unlockedMap[difficulty] || [1]);
          setForDiff.add(lvl);
          unlockedMap[difficulty] = Array.from(setForDiff).sort((a: number, b: number) => a - b);
          const newProg = { ...progress, unlocked: unlockedMap };
          saveProgress(newProg);
          break;
        }

        case "SHOW_PUZZLE": {
          // local UI show puzzle
          setStateRaw((prev) => ({ ...(prev as Record<string, unknown>), currentPuzzle: action.payload, showPuzzle: true }));
          break;
        }

        case "HIDE_PUZZLE": {
          setStateRaw((prev) => ({ ...(prev as Record<string, unknown>), currentPuzzle: null, showPuzzle: false }));
          break;
        }

        case "UPDATE_RESOURCES": {
          setStateRaw((prev) => ({ ...(prev as Record<string, unknown>), ...(action.payload as Record<string, unknown>) }));
          break;
        }

        case "GAME_OVER": {
          setStateRaw((prev) => ({ ...(prev as Record<string, unknown>), phase: "gameOver", is_game_over: true }));
          break;
        }

        default:
          console.warn("Unknown action", action);
      }
    } catch (err) {
      console.error("Dispatch error", err);
    }
  };

  const unlockLevel = (lvl: number, difficulty?: string) => {
    const raw = difficulty ?? (state as Record<string, unknown>)?.difficulty ?? "normal";
    const diff = typeof raw === "string" && (raw === "easy" || raw === "normal" || raw === "impossible") ? raw : "normal";

    const unlockedMap: Record<string, number[]> = { ...(progress.unlocked || { easy: [1], normal: [1], impossible: [1] }) };
    const setForDiff = new Set<number>(unlockedMap[diff] ?? [1]);
    setForDiff.add(lvl);
    unlockedMap[diff] = Array.from(setForDiff).sort((a: number, b: number) => a - b);
    const newProg = { ...progress, unlocked: unlockedMap };
    saveProgress(newProg);
  };

  return <GameContext.Provider value={{ state, setState, reset, dispatch, progress, unlockLevel, bgmMuted, toggleBgm }}>{children}</GameContext.Provider>;
}

/**
 * ========================
 * HOOK
 * ========================
 */

// Allow exporting the hook here; fast-refresh rule flags non-component exports.
// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used inside GameProvider");
  }
  return ctx;
}
