import React, { useEffect } from "react";
import { useGame } from "../context/GameContext";

import MainMenu from "./MainMenu";
import GameBoard from "./GameBoard";
import GameOver from "./GameOver";
import Victory from "./Victory";

export default function GameContainer() {
  const { state, dispatch } = useGame();
  const gameId = state?.game_id;
  const phase = state?.phase;

  /**
   * ==========================
   * GLOBAL GAME TICK (1s)
   * ==========================
   * Frontend TIDAK tahu apa
   * yang terjadi di tick.
   * Frontend hanya memicu.
   */
  useEffect(() => {
    if (!gameId) return;
    if (phase !== "playing") return;

    const interval = setInterval(async () => {
      try {
        await dispatch({ type: "TICK" });
      } catch (error) {
        console.error("Game tick failed:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameId, phase, dispatch]);

  /**
   * ==========================
   * SCREEN ROUTING
   * ==========================
   */
  const renderContent = () => {
    if (!state) {
      return <MainMenu />;
    }

    switch (state.phase) {
      case "victory":
        return <Victory />;

      case "gameOver":
        return <GameOver />;

      case "playing":
      case "paused":
        return <GameBoard />;

      case "menu":
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">{renderContent()}</div>
    </div>
  );
}
