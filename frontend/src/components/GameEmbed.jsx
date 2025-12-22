import React, { useEffect, useRef, useState } from "react";

// This is a placeholder for each game. Replace with real game logic or import.
const gameScripts = {
  snake: () => import("../games/snake.js"),
  flappy_bird: () => import("../games/flappy_bird.js"),
  brick_breaker: () => import("../games/brick_breaker.js"),
  endless_runner: () => import("../games/endless_runner.js"),
};


function GameEmbed({ gameKey, onExit }) {
  const canvasRef = useRef(null);
  const gameControlRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cleanup = null;
    if (gameScripts[gameKey]) {
      gameScripts[gameKey]().then((mod) => {
        if (mod && typeof mod.default === "function") {
          // Pass gameControlRef to allow game to expose control methods
          cleanup = mod.default(canvasRef.current, gameControlRef);
        }
      });
    }
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line
  }, [gameKey]);

  // Button handlers (replace with real logic as needed)
  const handlePause = () => {
    if (gameControlRef.current) {
      if (paused) {
        if (typeof gameControlRef.current.resume === "function") gameControlRef.current.resume();
        setPaused(false);
      } else {
        if (typeof gameControlRef.current.pause === "function") gameControlRef.current.pause();
        setPaused(true);
      }
    } else {
      alert("Pause/Resume not implemented in this game");
    }
  };
  const handleRestart = () => {
    if (gameControlRef.current && typeof gameControlRef.current.restart === "function") {
      gameControlRef.current.restart();
      setPaused(false);
    } else {
      alert("Restart not implemented in this game");
    }
  };
  const handleMenu = () => {
    onExit();
  };

  return (
    <div className="game-embed">
      <h2>Playing {gameKey.replace("_", " ")}</h2>
      <canvas ref={canvasRef} width={480} height={480} style={{ background: "#222", borderRadius: 8, marginBottom: 16 }} />
      <div className="game-embed-btn-row">
        <button className="pause-btn" onClick={handlePause}>{paused ? "Resume" : "Pause"}</button>
        <button className="menu-btn" onClick={handleMenu}>Main Menu</button>
      </div>
    </div>
  );
}

export default GameEmbed;
