import React from "react";
import { useGame } from "../context/GameContext";
import { Crown, Trophy, Star } from "lucide-react";

export default function Victory() {
  const { state, dispatch } = useGame();

  // final score is provided by backend and capped at 100
  const totalScore = state.score ?? 0;

  const formatTime = (secs: number | undefined | null) => {
    const s = Math.max(0, Math.floor(secs ?? 0));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-center text-white">
      <div className="mb-8">
        <Crown size={80} className="mx-auto mb-4 text-yellow-400 animate-pulse" />
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Mind Mastered!</h2>
        <p className="text-xl text-gray-300 mb-2">You have successfully navigated the labyrinth of your mind!</p>
        <p className="text-gray-400">
          Level {state.level} completed on {state.difficulty?.toUpperCase()} difficulty
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 rounded-xl mb-8 max-w-md mx-auto border border-purple-500/30">
        <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center justify-center space-x-2">
          <Trophy className="text-yellow-400" size={20} />
          <span>Victory Stats</span>
        </h3>

        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-400">Health Remaining:</p>
            <p className="font-semibold text-green-400">{state.health}%</p>
          </div>
          <div>
            <p className="text-gray-400">Energy Left:</p>
            <p className="font-semibold text-yellow-400">{Math.round(((state.energy ?? 0) / 100) * 100)}%</p>
          </div>
          <div>
            <p className="text-gray-400">Time Remaining:</p>
            <p className="font-semibold text-blue-400">{formatTime(state.time ?? state.time_left)}</p>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-4 text-center">
          <p className="text-gray-400 mb-1">Total Score:</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{totalScore.toLocaleString()}</p>
        </div>
      </div>

      {/* removed 'impossible' special reward per design */}

      <div className="mt-6">
        {state.level < 6 ? (
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto items-center">
            <div className="flex justify-start">
              <button
                onClick={() => dispatch({ type: "START_GAME", payload: { level: 1 } })}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Restart Level 1
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => dispatch({ type: "RESET_GAME" })}
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Back to Menu
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => dispatch({ type: "NEXT_LEVEL" })}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Next Level
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto items-center">
            <div className="flex justify-start">
              <button
                onClick={() => dispatch({ type: "START_GAME", payload: { level: 1 } })}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Restart Level 1
              </button>
            </div>

            <div />

            <div className="flex justify-end">
              <button
                onClick={() => dispatch({ type: "RESET_GAME" })}
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-400">
        <p>"The mind that opens to a new idea never returns to its original size..."</p>
      </div>
    </div>
  );
}
