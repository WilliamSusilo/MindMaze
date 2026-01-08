import React from "react";
import { useGame } from "../context/GameContext";
import { Skull, RotateCcw, Home } from "lucide-react";

export default function GameOver() {
  const { state, dispatch } = useGame();

  const formatTime = (secs: number | undefined | null) => {
    const s = Math.max(0, Math.floor(secs ?? 0));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-center text-white">
      <div className="mb-8">
        <Skull size={80} className="mx-auto mb-4 text-red-400 animate-pulse" />
        <h2 className="text-4xl font-bold mb-4 text-red-400">Mind Lost</h2>
        <p className="text-xl text-gray-300 mb-2">The labyrinth has claimed another wanderer...</p>
        <p className="text-gray-400">
          You reached Level {state.level} with {state.score} points
        </p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg mb-8 max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Game Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Difficulty:</p>
            <p className="font-semibold text-purple-400 capitalize">{state.difficulty}</p>
          </div>
          <div>
            <p className="text-gray-400">Final Score:</p>
            <p className="font-semibold text-blue-400">{state.score}</p>
          </div>
          <div>
            <p className="text-gray-400">Health:</p>
            <p className="font-semibold text-red-400">{state.health}%</p>
          </div>
          <div>
            <p className="text-gray-400">Energy:</p>
            <p className="font-semibold text-yellow-400">{Math.round(((state.energy ?? 0) / 100) * 100)}%</p>
          </div>
          <div>
            <p className="text-gray-400">Time Remaining:</p>
            <p className="font-semibold text-blue-400">{formatTime(state.time ?? state.time_left)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => dispatch({ type: "START_GAME", payload: { level: state.level } })}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Try Again</span>
        </button>

        <button
          onClick={() => dispatch({ type: "RESET_GAME" })}
          className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          <Home size={20} />
          <span>Main Menu</span>
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-400">
        <p>"In the labyrinth of the mind, every dead end teaches wisdom..."</p>
      </div>
    </div>
  );
}
