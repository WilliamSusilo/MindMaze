import React from "react";
import { useGame } from "../context/GameContext";
import type { Difficulty } from "../types/game";
import { Brain, Zap, Skull, Info } from "lucide-react";

const difficultyConfig = {
  easy: {
    icon: Brain,
    title: "Easy",
    description: "Beginner-friendly maze: visible map, single key required",
    color: "from-green-500 to-emerald-600",
    features: ["Visible map (no darkness)", "Collect the key before exiting", "Static traps and multiple routes"],
  },
  normal: {
    icon: Zap,
    title: "Normal",
    description: "Standard challenge: larger maze with patrolling enemies and puzzles",
    color: "from-blue-500 to-cyan-600",
    features: ["Larger maze, key required", "Patrolling enemies (avoid collisions)", "Static traps and puzzles to solve"],
  },
  impossible: {
    icon: Skull,
    title: "Impossible",
    description: "Memorization mode: brief map preview then darkness; extremely winding corridors",
    color: "from-orange-500 to-red-600",
    features: ["Short map preview, then arena goes dark (memorize the layout)", "No moving enemies — focus on complex corridors and traps", "Key required; more twisty paths and tougher traps"],
  },
  // 'impossible' removed per design
};

export default function MainMenu() {
  const { state, dispatch, progress, bgmMuted, toggleBgm } = useGame();
  const [showLevelSelect, setShowLevelSelect] = React.useState(false);
  const [showHowTo, setShowHowTo] = React.useState(false);

  const handleDifficultySelect = (difficulty: Difficulty) => {
    console.debug("MainMenu: difficulty selected", difficulty);
    dispatch({ type: "SET_DIFFICULTY", payload: difficulty });
  };

  const handleStartGame = () => {
    const raw = (state as Record<string, unknown>)?.difficulty;
    const current = typeof raw === "string" && (raw === "easy" || raw === "normal" || raw === "impossible") ? (raw as Difficulty) : undefined;
    if (current) {
      // open level selector instead of starting directly
      console.debug("MainMenu: start pressed, opening level selector for", current);
      setShowLevelSelect(true);
    }
  };

  const handleSelectLevel = async (lvl: number) => {
    // start game at selected level
    console.debug("MainMenu: level select", lvl);
    await dispatch({ type: "START_GAME", payload: { level: lvl } });
    setShowLevelSelect(false);
  };

  // derive unlocked levels per difficulty from progress storage
  const unlocked = (progress?.unlocked ?? { easy: [1], normal: [1], impossible: [1] }) as Record<Difficulty, number[]>;
  const totalUnlockedCount = (unlocked.easy?.length || 0) + (unlocked.normal?.length || 0) + (unlocked.impossible?.length || 0);
  const maxTotal = 3 * 6; // three difficulties, 6 levels each
  const progressPercent = Math.min(100, Math.round((totalUnlockedCount / maxTotal) * 100));

  const currentDifficulty = (() => {
    const raw = (state as Record<string, unknown>)?.difficulty;
    return typeof raw === "string" && (raw === "easy" || raw === "normal" || raw === "impossible") ? (raw as Difficulty) : undefined;
  })();

  return (
    <div className="text-center text-white px-4 pt-12">
      <div className="absolute top-6 right-6 flex items-center space-x-2">
        <button onClick={() => setShowHowTo(true)} title="How to Play" className="p-2 rounded-md bg-slate-800/40 hover:bg-slate-700/60 flex items-center">
          <Info size={18} className="text-white mr-2" />
          <span className="text-sm text-white">How to Play</span>
        </button>
        <button onClick={() => toggleBgm && toggleBgm()} className="p-2 rounded-md bg-slate-800/40 hover:bg-slate-700/60">
          {bgmMuted ? <span className="text-sm text-white">BGM Off</span> : <span className="text-sm text-white">BGM On</span>}
        </button>
      </div>
      <div className="mb-12">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Labyrinth of Mind</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">Navigate through dark mazes using only your memory. Each difficulty tests your limits in unique ways.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
        {(["easy", "normal", "impossible"] as Difficulty[]).map((difficulty) => {
          const config = difficultyConfig[difficulty];
          const Icon = config.icon;
          const isSelected = currentDifficulty === difficulty;

          return (
            <div
              key={difficulty}
              onClick={() => handleDifficultySelect(difficulty)}
              className={
                "cursor-pointer p-6 rounded-xl transition-all duration-300 transform hover:scale-105 " +
                (isSelected ? `bg-gradient-to-br ${config.color} shadow-lg shadow-purple-500/25` : "bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600")
              }
            >
              <div className="flex flex-col items-center mb-4">
                <Icon size={40} className={`mb-2 ${isSelected ? "text-white" : "text-gray-400"}`} />
                <h3 className={`text-xl font-bold ${isSelected ? "text-white" : "text-gray-200"}`}>{config.title}</h3>
              </div>

              <p className={`text-sm mb-4 ${isSelected ? "text-white/90" : "text-gray-400"}`}>{config.description}</p>

              <ul className={`text-xs space-y-1 ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                {config.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {!currentDifficulty && <div className="mb-4 text-sm text-yellow-200">Please select a difficulty to enable Start</div>}

      {currentDifficulty && (
        <button
          onClick={handleStartGame}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Enter the Labyrinth
        </button>
      )}

      {/* How to Play Modal */}
      {showHowTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowHowTo(false)} />
          <div className="relative bg-slate-900 rounded-lg p-6 w-full max-w-4xl mx-4 overflow-y-auto max-h-[80vh]">
            <h3 className="text-2xl font-bold text-white mb-2">How to Play — Labyrinth of Mind</h3>
            <p className="text-sm text-gray-300 mb-4">Detailed instructions, controls, objectives and tips.</p>

            <section className="mb-4">
              <h4 className="text-white font-semibold">1. Overview</h4>
              <p className="text-gray-300 text-sm">
                You play as a character exploring a maze. Your goal is to reach the exit before time runs out. In many levels you must collect a key first to unlock the exit. Each attempt generates a new maze layout.
              </p>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">2. Difficulties</h4>
              <ul className="text-gray-300 text-sm space-y-2 list-disc list-inside">
                <li>
                  <strong>Easy</strong>: Small arena, visible map (no darkness), static traps, time-limited.
                </li>
                <li>
                  <strong>Normal</strong>: Medium arena, larger and with patrolling enemies; hitting walls reduces health on Normal, time-limited.
                </li>
                <li>
                  <strong>Impossible</strong>: Memorization + time pressure. Short map preview then darkness (map hidden), extremely winding corridors, and static traps.
                </li>
              </ul>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">3. Level Structure (Levels 1–6)</h4>
              <p className="text-gray-300 text-sm">
                Each difficulty contains 6 levels. Levels increase in complexity and size as you progress. Expect more dead-ends, longer routes, and trickier trap placement on higher levels. Every time you restart or switch levels a new
                maze is generated.
              </p>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">4. Rules & Objectives</h4>
              <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                <li>Move through the maze and reach the exit before time expires.</li>
                <li>In levels that require a key, you must collect the key (highlighted visually) before the exit will count as a win.</li>
                <li>Avoid traps and enemies. On Normal, hitting walls also reduces health.</li>
                <li>Complete levels to unlock the next level and earn best-time records.</li>
              </ul>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">5. Controls</h4>
              <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                <li>
                  <strong>Keyboard</strong>: Arrow keys or WASD to move.
                </li>
                <li>
                  <strong>Voice</strong>: Optional voice control — say "Up", "Down", "Left", or "Right" (English) to move. Choose interaction mode in-game.
                </li>
                <li>
                  <strong>Action</strong>: Walking onto a key automatically picks it up; reaching the exit while holding the key opens it.
                </li>
              </ul>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">6. UI & Feedback</h4>
              <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                <li>Health, Energy and Time are visible in the resource bar.</li>
                <li>Picked keys disappear from the map and your key count increases.</li>
                <li>After finishing a level you'll see remaining time and final score; best times and scores are saved locally.</li>
              </ul>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">7. Tips & Strategy</h4>
              <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                <li>On Easy, explore calmly — the map is visible so focus on efficient routing to save time.</li>
                <li>On Normal, avoid patrolling enemies — do not block yourself into a single corridor if possible.</li>
                <li>On Impossible, pay attention during the short preview and memorize landmark positions; plan your route before the lights go out.</li>
                <li>Keys are intentionally placed off the shortest direct path to the exit — plan a route that lets you return without running into unavoidable hazards.</li>
              </ul>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">8. Rewards & Progress</h4>
              <p className="text-gray-300 text-sm">Completing a level unlocks the next one (up to level 6). The game saves best time and best score per difficulty and level locally.</p>
            </section>

            <section className="mb-4">
              <h4 className="text-white font-semibold">9. Known Limitations</h4>
              <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                <li>Voice control depends on browser support and microphone quality; results may vary.</li>
                <li>Impossible mode can be challenging because of darkness and winding corridors — start on Easy if new to the game.</li>
              </ul>
            </section>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowHowTo(false)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level selection modal */}
      {showLevelSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLevelSelect(false)} />
          <div className="relative bg-slate-900 rounded-lg p-6 w-full max-w-3xl mx-4">
            <h3 className="text-2xl font-bold text-white mb-2">Select Level - {currentDifficulty?.toUpperCase() ?? ""}</h3>
            <p className="text-sm text-gray-300 mb-4">Choose a level to start. Locked levels are grayed out until you unlock them.</p>

            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => {
                const lvl = idx + 1;
                const unlockedForDiff = currentDifficulty ? progress?.unlocked?.[currentDifficulty] ?? [1] : [1];
                const isUnlocked = unlockedForDiff.includes(lvl);
                return (
                  <button
                    key={lvl}
                    onClick={() => isUnlocked && handleSelectLevel(lvl)}
                    disabled={!isUnlocked}
                    className={`p-4 rounded-lg text-left border ${isUnlocked ? "bg-gradient-to-br from-slate-800 to-slate-700 hover:scale-105 transform" : "bg-slate-800/30 opacity-50 cursor-not-allowed"} border-slate-700`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-white">Level {lvl}</div>
                        <div className="text-xs text-gray-400">Arena {lvl}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {(() => {
                            const key = `${currentDifficulty ?? "normal"}:${lvl}`;
                            const bt = progress?.bestTimes?.[key] ?? 0;
                            const bs = progress?.bestScores?.[key] ?? 0;
                            const fmt = (s: number) => (s ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}` : "-");
                            return (
                              <>
                                <span className="mr-2">Best: {fmt(bt)}</span>
                                <span className="text-yellow-300">Score: {bs || "-"}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">{isUnlocked ? "Unlocked" : "Locked"}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowLevelSelect(false)} className="px-4 py-2 bg-slate-700 text-white rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-400">
        <p>Use arrow keys or WASD to move • Explore the maze and reach the exit</p>
      </div>

      <div className="mt-6 max-w-xl mx-auto">
        <div className="p-4 bg-gradient-to-b from-slate-900/60 to-slate-800/40 border border-slate-700 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">Progress</h4>
            <div className="text-sm text-gray-300">
              Unlocked: <span className="font-medium text-white">{totalUnlockedCount}</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["easy", "normal", "impossible"] as Difficulty[]).map((d) => (
              <div key={d}>
                <div className="text-xs font-semibold text-gray-300 mb-1">{difficultyConfig[d].title}</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const lvl = i + 1;
                    const isUnlocked = (unlocked[d] || []).includes(lvl);
                    return (
                      <span key={`${d}-${lvl}`} className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${isUnlocked ? "bg-emerald-600 text-white" : "bg-slate-800 text-gray-500"}`}>
                        L{lvl}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-400">Unlocked levels are saved locally. Progress shows levels you can replay.</p>
        </div>
      </div>

      {/* Credits card (shown on main menu only) */}
      <div className="mt-8 max-w-3xl mx-auto px-4">
        <div className="p-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white rounded-lg shadow-lg border border-white/5">
          <div className="text-center mb-3">
            <div className="text-sm font-semibold">Created by</div>
            <div className="text-xs text-white/80">The MindMaze Team</div>
          </div>

          <div className="flex items-center justify-center gap-8">
            {[
              { name: "Dynand.W", initials: "DW" },
              { name: "Kenny.A.S", initials: "KA" },
              { name: "Wahyu.C.A.A", initials: "WA" },
              { name: "William.S", initials: "WS" },
            ].map((p) => (
              <div key={p.name} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm drop-shadow">{p.initials}</div>
                <div className="mt-2 text-sm italic text-white/90">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
