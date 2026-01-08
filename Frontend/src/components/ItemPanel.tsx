import React from "react";
import { useGame } from "../context/GameContext";
import { Flashlight, Compass, Clock } from "lucide-react";

export default function ItemPanel() {
  const { state, dispatch } = useGame();

  const handleUseItem = (itemType: "flashlight" | "compass" | "timeFreeze") => {
    const item = state.items.find((i) => i.type === itemType);
    if (item && item.uses > 0) {
      dispatch({ type: "USE_ITEM", payload: itemType });
    }
  };

  const itemConfig = {
    flashlight: {
      icon: Flashlight,
      name: "Flashlight",
      description: "Reveals 3x3 area around you",
      color: "from-yellow-500 to-orange-500",
    },
    compass: {
      icon: Compass,
      name: "Compass",
      description: "Points toward the exit",
      color: "from-blue-500 to-cyan-500",
    },
    timeFreeze: {
      icon: Clock,
      name: "Time Freeze",
      description: "Stops enemies for 10 seconds",
      color: "from-purple-500 to-pink-500",
    },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold text-lg">Items</h3>
      {/* Keys status — only show when keys are required in this level */}
      {state.keys_required > 0 && (
        <div className="text-sm text-gray-300 mb-2">
          <p className="text-gray-400">
            Keys:{" "}
            <span className="text-white font-semibold">
              {state.keys_collected || 0} / {state.keys_required}
            </span>
          </p>
          <p className="text-xs text-gray-500">Collect all keys to unlock the exit.</p>
        </div>
      )}

      {state.items.map((item, index) => {
        const config = itemConfig[item.type];
        const Icon = config.icon;
        const canUse = item.uses > 0;

        return (
          <div
            key={index}
            onClick={() => canUse && handleUseItem(item.type)}
            className={`
              p-3 rounded-lg border transition-all duration-300
              ${canUse ? "bg-slate-700 border-slate-600 hover:bg-slate-600 cursor-pointer transform hover:scale-105" : "bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed"}
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color}`}>
                <Icon size={20} className="text-white" />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-medium">{config.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.uses > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>{item.uses}x</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">{config.description}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Active effects */}
      {(state.flashlightActive || state.compassActive || state.isTimeFrozen) && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">Active Effects</h4>
          <div className="space-y-1 text-xs">
            {state.flashlightActive && <p className="text-yellow-300">• Flashlight active</p>}
            {state.compassActive && <p className="text-blue-300">• Compass guiding</p>}
            {state.isTimeFrozen && <p className="text-purple-300">• Time frozen</p>}
          </div>
        </div>
      )}
    </div>
  );
}
