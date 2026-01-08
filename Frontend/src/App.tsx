import React from "react";
import { GameProvider } from "./context/GameContext";
import GameContainer from "./components/GameContainer";

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
        <GameContainer />
      </div>
    </GameProvider>
  );
}

export default App;
