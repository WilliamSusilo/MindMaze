import React, { useEffect, useCallback, useState } from "react";
import { Mic, MicOff, Info, Volume, VolumeX } from "lucide-react";
import { useGame } from "../context/GameContext";
import type { GameState } from "../types/game";

import Maze from "./Maze";
import ResourceBar from "./ResourceBar";
import PuzzleModal from "./PuzzleModal";

export default function GameBoard() {
  const { state, dispatch, progress, bgmMuted, toggleBgm } = useGame();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [showLevelSwitch, setShowLevelSwitch] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  const handleKeyPress = useCallback(
    async (e: KeyboardEvent) => {
      if (!state) return;
      if (state.phase !== "playing") return;
      if (state.showPuzzle) return;

      let direction: "up" | "down" | "left" | "right" | null = null;

      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          direction = "up";
          break;
        case "arrowdown":
        case "s":
          direction = "down";
          break;
        case "arrowleft":
        case "a":
          direction = "left";
          break;
        case "arrowright":
        case "d":
          direction = "right";
          break;
        default:
          return;
      }

      try {
        await dispatch({ type: "MOVE", payload: direction });
      } catch (error) {
        console.error("Move failed:", error);
      }
    },
    [state, dispatch]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Global shortcuts: L = open voice guide, M = toggle microphone
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === "l") {
        setShowVoiceGuide(true);
        e.preventDefault();
        return;
      }
      if (key === "m") {
        setVoiceEnabled((v) => !v);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Voice control
  useEffect(() => {
    if (!voiceEnabled) return;
    // Lightweight local types for browsers that expose SpeechRecognition
    type SRAlt = { transcript: string };
    type SRResult = { 0: SRAlt; length: number } & Array<SRAlt>;
    type SREventLike = { results: SRResult[] };
    type SRLike = {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onstart?: () => void;
      onend?: () => void;
      onerror?: (e: unknown) => void;
      onresult?: (e: SREventLike) => void;
      start: () => void;
      stop: () => void;
    };

    type SRConstructor = new () => SRLike;
    const winWithSR = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const SpeechRecognitionCtor = winWithSR.SpeechRecognition || winWithSR.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }

    const recog = new SpeechRecognitionCtor() as SRLike;
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.continuous = true;

    recog.onstart = () => setRecognitionActive(true);
    recog.onend = () => setRecognitionActive(false);

    recog.onerror = (err: unknown) => {
      console.error("Speech recognition error", err);
      setRecognitionActive(false);
    };

    recog.onresult = (event: SREventLike) => {
      const results = event.results;
      const last = results && results.length ? results[results.length - 1] : undefined;
      const transcript = last && last[0] && last[0].transcript ? last[0].transcript.toLowerCase().trim() : "";

      // map common words (English and Indonesian)
      let dir: string | null = null;
      if (transcript.includes("up") || transcript.includes("atas")) dir = "up";
      if (transcript.includes("down") || transcript.includes("bawah")) dir = "down";
      if (transcript.includes("left") || transcript.includes("kiri")) dir = "left";
      if (transcript.includes("right") || transcript.includes("kanan")) dir = "right";

      if (dir && state && state.phase === "playing" && !state.showPuzzle) {
        dispatch({ type: "MOVE", payload: dir });
      }
    };

    try {
      recog.start();
    } catch (err) {
      console.warn(err);
    }

    return () => {
      try {
        recog.stop();
      } catch {
        // ignore stop errors
      }
    };
  }, [voiceEnabled, state, dispatch]);

  if (!state) return null;

  // Narrow `state` for render-time usage to avoid "possibly null" alerts
  function assertIsGameState(v: unknown): asserts v is GameState {
    if (!v || typeof v !== "object") throw new Error("Game state is not available");
  }

  assertIsGameState(state);
  const s = state;

  if (!s.maze?.length) return null;

  const mapTimer = typeof s.mapTimer === "number" ? s.mapTimer : 0;
  const showMapPreview = s.difficulty === "impossible" && mapTimer > 0;
  const mapPreview: React.ReactNode = showMapPreview ? <div className="bg-yellow-500 text-black text-center py-2 font-bold">Memorize the path! Time remaining: {mapTimer}s</div> : null;

  return (
    <>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900/80 backdrop-blur">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              Level {s.level} - {s.difficulty.toUpperCase()}
            </h2>
            <div className="flex items-center space-x-3">
              <div className="text-white text-sm">Score: {s.score}</div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setVoiceEnabled((v) => !v)}
                    title={voiceEnabled ? "Disable voice control" : "Enable voice control"}
                    aria-pressed={voiceEnabled}
                    aria-label={voiceEnabled ? "Disable voice control" : "Enable voice control"}
                    className={`p-3 rounded-full flex items-center justify-center transition-transform transform text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      voiceEnabled ? "bg-red-600 ring-2 ring-offset-2 ring-red-400 scale-105" : "bg-slate-700 hover:scale-105"
                    } ${recognitionActive ? "animate-pulse ring-4 ring-red-300/40" : ""}`}
                  >
                    {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>

                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-semibold text-emerald-300">Voice</span>
                    <span className="text-[11px] text-gray-300">Say: up / down / left / right</span>
                  </div>
                </div>

                <button onClick={() => setShowVoiceGuide(true)} title="Voice control guide" className="p-2 rounded bg-slate-700 text-white">
                  <Info size={16} />
                </button>

                {/* BGM toggle (moved to header for less crowding) */}
                <button
                  onClick={() => toggleBgm && toggleBgm()}
                  title={bgmMuted ? "Unmute Music" : "Mute Music"}
                  aria-pressed={bgmMuted}
                  className={`p-3 rounded-full flex items-center justify-center transition-transform transform text-white bg-slate-700 hover:scale-105`}
                >
                  {bgmMuted ? <VolumeX size={18} /> : <Volume size={18} />}
                </button>
              </div>
              <button onClick={() => setShowExitConfirm(true)} title="Exit to Main Menu" className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold border-2 border-red-700">
                Exit
              </button>
            </div>
          </div>
          <ResourceBar />
        </div>

        {/* Map preview - only show the banner for Impossible difficulty while preview timer is active */}
        {mapPreview}

        {/* Game Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <Maze />
          </div>

          <div className="w-80 bg-slate-800/80 backdrop-blur p-4 overflow-y-auto">
            {/* Items panel removed — inventory is not used in this build */}

            <div className="mt-2">
              <button onClick={() => setShowLevelSwitch(true)} className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-lg font-semibold text-sm">
                Change Level
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Controls</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Arrow Keys or WASD to move</p>
                <p>
                  • Voice: Toggle the microphone (<span className="font-semibold">M</span>) or press <span className="font-semibold">L</span> for the guide, then say <span className="font-semibold">up</span>,{" "}
                  <span className="font-semibold">down</span>, <span className="font-semibold">left</span>, or <span className="font-semibold">right</span>
                </p>
                <p>• Complete puzzles when triggered</p>
                <p>• Reach the exit</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Best Records</h3>
              <div className="text-gray-300 text-sm space-y-2">
                {(() => {
                  const key = `${s.difficulty}:${s.level}`;
                  const bestTimes = (progress && progress.bestTimes) || {};
                  const bestScores = (progress && progress.bestScores) || {};
                  const bt = bestTimes[key] ?? 0;
                  const bs = bestScores[key] ?? 0;
                  const format = (s: number) => {
                    if (!s) return "-";
                    const mins = Math.floor(s / 60);
                    const secs = s % 60;
                    return `${mins}:${secs.toString().padStart(2, "0")}`;
                  };
                  return (
                    <>
                      <div className="flex justify-between">
                        <div className="text-xs text-gray-400">Best Time</div>
                        <div className="text-sm font-semibold text-emerald-300">{format(bt)}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-xs text-gray-400">Best Score</div>
                        <div className="text-sm font-semibold text-yellow-300">{bs ? bs : "-"}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {s.showPuzzle && <PuzzleModal />}
        {showLevelSwitch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => {
                setShowLevelSwitch(false);
                setPendingLevel(null);
              }}
            />
            <div className="relative bg-slate-900 rounded-lg p-6 w-full max-w-3xl mx-4">
              <h3 className="text-2xl font-bold text-white mb-2">Switch Level - {s.difficulty?.toUpperCase()}</h3>
              <p className="text-sm text-gray-300 mb-4">Select a level within the same difficulty to jump to. Current run will be restarted.</p>

              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const lvl = idx + 1;
                  const unlockedForDiff = (progress && progress.unlocked && progress.unlocked[s.difficulty]) || [1];
                  const isUnlocked = unlockedForDiff.includes(lvl);
                  const isCurrent = s.level === lvl;
                  return (
                    <div key={lvl} className="">
                      <button
                        onClick={() => isUnlocked && setPendingLevel(lvl)}
                        disabled={!isUnlocked}
                        className={`w-full p-4 rounded-lg text-left border ${isUnlocked ? "bg-slate-800 hover:scale-105 transform" : "bg-slate-800/30 opacity-50 cursor-not-allowed"} border-slate-700`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-white">Level {lvl}</div>
                            <div className="text-xs text-gray-400">Arena {lvl}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {(() => {
                                const key = `${s.difficulty}:${lvl}`;
                                const bt = (progress && progress.bestTimes && progress.bestTimes[key]) || 0;
                                const bs = (progress && progress.bestScores && progress.bestScores[key]) || 0;
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
                          <div className="text-sm text-gray-300">{isCurrent ? "Current" : isUnlocked ? "Unlocked" : "Locked"}</div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {pendingLevel && (
                <div className="mt-4 p-4 bg-slate-800/60 rounded">
                  <p className="text-sm text-gray-200">
                    Switch to <strong>Level {pendingLevel}</strong>? This will restart the current run.
                  </p>
                  <div className="mt-3 flex justify-end space-x-2">
                    <button onClick={() => setPendingLevel(null)} className="px-3 py-2 bg-slate-700 text-white rounded">
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await dispatch({ type: "START_GAME", payload: { level: pendingLevel } });
                        setShowLevelSwitch(false);
                        setPendingLevel(null);
                      }}
                      className="px-3 py-2 bg-emerald-600 text-white rounded"
                    >
                      Switch
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowLevelSwitch(false);
                    setPendingLevel(null);
                  }}
                  className="px-4 py-2 bg-slate-700 text-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showVoiceGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowVoiceGuide(false)} />
            <div className="relative bg-slate-900 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-white mb-2">Voice Control Guide</h3>
              <p className="text-sm text-gray-300 mb-3">Use the following single-word voice commands to move the player:</p>
              <ul className="text-sm text-gray-200 space-y-2 mb-4">
                <li>• "up" — move up</li>
                <li>• "down" — move down</li>
                <li>• "left" — move left</li>
                <li>• "right" — move right</li>
              </ul>
              <p className="text-xs text-gray-400 mb-3">How to use: enable the microphone, then speak a single command. This feature requires SpeechRecognition support in your browser.</p>
              <div className="flex justify-end">
                <button onClick={() => setShowVoiceGuide(false)} className="px-4 py-2 bg-slate-700 text-white rounded">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowExitConfirm(false)} />
            <div className="relative bg-slate-800 rounded-lg p-6 w-full max-w-md shadow-lg border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-2">Exit to main menu</h3>
              <p className="text-sm text-gray-300 mb-4">Are you sure you want to exit? Current run progress will be lost.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 bg-slate-700 text-white rounded">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await dispatch({ type: "RESET_GAME" });
                    } catch (e) {
                      console.error("Exit failed", e);
                    } finally {
                      setShowExitConfirm(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer removed from in-game view; credits moved to Main Menu */}
    </>
  );
}
