import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { X } from "lucide-react";

export default function PuzzleModal() {
  const { state, dispatch } = useGame();
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [showSequence, setShowSequence] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const puzzle = state.currentPuzzle;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSequence(false);
    }, puzzle?.showTime || 3000);

    return () => clearTimeout(timer);
  }, [puzzle]);

  useEffect(() => {
    if (!showSequence && userSequence.length === puzzle?.sequence.length) {
      const isCorrect = userSequence.every((color, index) => color === puzzle.sequence[index]);

      if (isCorrect) {
        setIsCompleted(true);
        setTimeout(() => {
          dispatch({ type: "COMPLETE_PUZZLE" });
        }, 1500);
      } else {
        // Wrong sequence — inform backend so server state stays authoritative
        // backend will apply the configured penalty and return updated state
        try {
          dispatch({ type: "FAIL_PUZZLE" });
        } catch (e) {
          // fallback: keep local UI stable
          console.warn("Fail puzzle dispatch failed", e);
        }

        // Reset local attempt UI
        setUserSequence([]);
      }
    }
  }, [userSequence, puzzle, showSequence, dispatch, state.difficulty, state.energy]);

  const handleColorClick = (color: string) => {
    if (showSequence || isCompleted) return;
    setUserSequence([...userSequence, color]);
  };

  const getColorClass = (color: string) => {
    const colorClasses = {
      red: "bg-red-500 hover:bg-red-600",
      blue: "bg-blue-500 hover:bg-blue-600",
      green: "bg-green-500 hover:bg-green-600",
      yellow: "bg-yellow-500 hover:bg-yellow-600",
      purple: "bg-purple-500 hover:bg-purple-600",
      orange: "bg-orange-500 hover:bg-orange-600",
      pink: "bg-pink-500 hover:bg-pink-600",
      cyan: "bg-cyan-500 hover:bg-cyan-600",
    };
    return colorClasses[color as keyof typeof colorClasses] || "bg-gray-500";
  };

  if (!puzzle) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full mx-4 border border-purple-500/30">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Color Sequence</h3>
          <button onClick={() => dispatch({ type: "HIDE_PUZZLE" })} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {showSequence ? (
          <div className="text-center">
            <p className="text-gray-300 mb-4">Memorize this sequence:</p>
            <div className="flex justify-center space-x-2 mb-4">
              {puzzle.sequence.map((color: string, index: number) => (
                <div key={index} className={`w-12 h-12 rounded-lg ${getColorClass(color)} animate-pulse`} />
              ))}
            </div>
            <p className="text-sm text-gray-400">Time remaining: {Math.ceil((puzzle.showTime - (Date.now() - puzzle.startTime)) / 1000)}s</p>
          </div>
        ) : isCompleted ? (
          <div className="text-center">
            <p className="text-green-400 text-xl font-semibold mb-4">Perfect! ✨</p>
            <p className="text-gray-300">Gate opening...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-300 mb-4">Repeat the sequence:</p>

            {/* User's current sequence */}
            <div className="flex justify-center space-x-2 mb-6">
              {userSequence.map((color, index) => (
                <div key={index} className={`w-8 h-8 rounded ${getColorClass(color)}`} />
              ))}
              {Array.from({ length: puzzle.sequence.length - userSequence.length }).map((_, index) => (
                <div key={`empty-${index}`} className="w-8 h-8 rounded border-2 border-dashed border-gray-500" />
              ))}
            </div>

            {/* Color buttons */}
            <div className="grid grid-cols-4 gap-3">
              {["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"].map((color) => (
                <button key={color} onClick={() => handleColorClick(color)} className={`w-12 h-12 rounded-lg ${getColorClass(color)} transition-all duration-200 transform hover:scale-110`} />
              ))}
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Progress: {userSequence.length}/{puzzle.sequence.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
