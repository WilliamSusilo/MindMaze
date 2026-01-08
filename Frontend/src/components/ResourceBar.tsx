import React from "react";
import { useGame } from "../context/GameContext";
import { Heart, Zap, Clock } from "lucide-react";

export default function ResourceBar() {
  const { state } = useGame();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBarColor = (value: number, max: number = 100) => {
    const percentage = value / max;
    if (percentage > 0.6) return "from-green-500 to-emerald-500";
    if (percentage > 0.3) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-red-600";
  };

  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      {/* Health */}
      <div className="flex items-center space-x-2">
        <Heart className="text-red-400" size={20} />
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Health</span>
            <span>{state.health}/100</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className={`bg-gradient-to-r ${getBarColor(state.health)} h-2 rounded-full transition-all duration-300`} style={{ width: `${state.health}%` }} />
          </div>
        </div>
      </div>

      {/* Energy */}
      <div className="flex items-center space-x-2">
        <Zap className="text-blue-400" size={20} />
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Energy</span>
            <span>{state.energy}/100</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className={`bg-gradient-to-r ${getBarColor(state.energy)} h-2 rounded-full transition-all duration-300`} style={{ width: `${state.energy}%` }} />
          </div>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center space-x-2">
        <Clock className="text-purple-400" size={20} />
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Time</span>
            <span>{formatTime(state.time)}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className={`bg-gradient-to-r ${getBarColor(state.time, 300)} h-2 rounded-full transition-all duration-300`} style={{ width: `${(state.time / 300) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
