import React, { useRef, useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Compass, Zap } from "lucide-react";
import PlayerImg from "../character/player.png";
import EnemyImg from "../character/enemy.png";
import TrapImg from "../character/trap.png";
import KeyImg from "../character/key.png";

export default function Maze() {
  const { state } = useGame();

  if (!state.maze.length) return null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [available, setAvailable] = useState({ w: 800, h: 600 });

  const mazeHeight = state.maze.length;
  const mazeWidth = state.maze[0].length;

  // compute dynamic cell size to better fill available area
  const computeCellSize = () => {
    const padding = 32; // account for p-4 and borders
    const maxW = Math.max(100, available.w - padding - 4);
    const maxH = Math.max(100, available.h - padding - 4);

    const sizeByWidth = Math.floor(maxW / mazeWidth);
    const sizeByHeight = Math.floor(maxH / mazeHeight);
    let base = Math.max(12, Math.min(sizeByWidth, sizeByHeight));

    // enlarge slightly for Easy difficulty to make the maze feel bigger,
    // but keep it modest so it doesn't get cut off at 100% viewport.
    if (state.difficulty === "easy") {
      base = Math.min(56, Math.floor(base * 1.12));
    }

    // clamp
    base = Math.max(10, Math.min(64, base));
    return base;
  };

  const [cellSize, setCellSize] = useState<number>(computeCellSize());

  useEffect(() => {
    setCellSize(computeCellSize());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.w, available.h, state.difficulty, mazeWidth, mazeHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setAvailable({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const renderCell = (cellValue: number, x: number, y: number) => {
    const isPlayer = state.playerPosition.x === x && state.playerPosition.y === y;
    const isVisible =
      state.mapVisible || (state.flashlightActive && Math.abs(state.playerPosition.x - x) <= 2 && Math.abs(state.playerPosition.y - y) <= 2) || (Math.abs(state.playerPosition.x - x) <= 1 && Math.abs(state.playerPosition.y - y) <= 1);

    let cellClass = "absolute transition-all duration-200 flex items-center justify-center text-xs";
    let bgColor = "bg-slate-800";
    let content = null;

    if (!isVisible && !state.mapVisible) {
      bgColor = "bg-black";
    } else {
      switch (cellValue) {
        case 0: // Path
          bgColor = "bg-slate-700";
          break;
        case 1: // Wall
          bgColor = "bg-slate-900 border border-slate-600";
          break;
        case 2: // Exit
          bgColor = "bg-gradient-to-r from-green-400 to-emerald-500";
          content = <div className="w-4 h-4 bg-white rounded-full animate-pulse" />;
          break;
        case 3: // Start
          bgColor = "bg-gradient-to-r from-blue-400 to-cyan-500";
          break;
      }
    }

    if (isPlayer) {
      const pSize = Math.max(12, cellSize * 0.75);
      content = (
        <div className="relative flex items-center justify-center">
          <div style={{ width: pSize, height: pSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={PlayerImg}
              alt="player"
              style={{
                width: pSize,
                height: pSize,
                objectFit: "contain",
                filter: "drop-shadow(0 6px 14px rgba(128,64,255,0.45)) saturate(1.15) brightness(1.05)",
                borderRadius: 6,
              }}
            />
          </div>
          {state.player_hit && <div className="absolute inset-0 border-2 border-red-400 rounded animate-ping" />}
        </div>
      );
      bgColor = "bg-gradient-to-r from-purple-500 to-pink-500";
    }

    // Check for enemies
    const enemy = state.enemies.find((e) => e.position.x === x && e.position.y === y);
    if (enemy && isVisible && !isPlayer) {
      const eSize = Math.max(12, cellSize * 0.75);
      content = (
        <div className="flex items-center justify-center">
          <img
            src={EnemyImg}
            alt="enemy"
            style={{
              width: eSize,
              height: eSize,
              objectFit: "contain",
              filter: "drop-shadow(0 6px 14px rgba(220,24,24,0.45)) saturate(1.1)",
              borderRadius: 6,
            }}
          />
        </div>
      );
      bgColor = "bg-red-600";
    }

    // Trap visual
    if (cellValue === 4 && isVisible && !isPlayer && !enemy) {
      const tSize = Math.max(12, cellSize * 0.9);
      content = (
        <div className="flex items-center justify-center">
          <img
            src={TrapImg}
            alt="trap"
            style={{
              width: tSize,
              height: tSize,
              objectFit: "contain",
              filter: "drop-shadow(0 6px 18px rgba(255,140,0,0.55)) saturate(1.2)",
            }}
          />
        </div>
      );
      bgColor = "bg-gray-700";
    }

    // Key visual
    if (cellValue === 5 && isVisible && !isPlayer && !enemy) {
      const kSize = Math.max(12, cellSize * 0.8);
      content = (
        <div className="flex items-center justify-center">
          <img
            src={KeyImg}
            alt="key"
            style={{
              width: kSize,
              height: kSize,
              objectFit: "contain",
              filter: "drop-shadow(0 6px 14px rgba(250,200,24,0.45)) saturate(1.2)",
            }}
          />
        </div>
      );
      bgColor = "bg-amber-600";
    }

    return (
      <div
        key={`${x}-${y}`}
        className={`${cellClass} ${bgColor}`}
        style={{
          left: x * cellSize,
          top: y * cellSize,
          width: cellSize,
          height: cellSize,
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-black p-4 overflow-hidden min-h-0" style={{ height: "100%" }}>
      <div
        className="relative border-2 border-purple-500/30 rounded-lg overflow-hidden"
        style={{
          width: mazeWidth * cellSize + 4,
          height: mazeHeight * cellSize + 4,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

        {state.maze.map((row, y) => row.map((cell, x) => renderCell(cell, x, y)))}

        {/* Compass indicator */}
        {state.compassActive && (
          <div className="absolute top-2 right-2 bg-blue-500/80 rounded-full p-2">
            <Compass size={16} className="text-white" />
          </div>
        )}

        {/* Flashlight indicator */}
        {state.flashlightActive && (
          <div className="absolute top-2 left-2 bg-yellow-500/80 rounded-full p-2">
            <Zap size={16} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
