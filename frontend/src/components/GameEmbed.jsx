import React, { useEffect, useRef, useState } from "react";

// This is a placeholder for each game. Replace with real game logic or import.
const gameScripts = {
  snake: () => import("../games/snake.js"),
  flappy_bird: () => import("../games/flappy_bird.js"),
  brick_breaker: () => import("../games/brick_breaker.js"),
  memory_match: () => import("../games/memory_match.js"),
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

  // Responsive canvas sizing
  const [canvasSize, setCanvasSize] = useState(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w < 600) {
      // Memory match: 4x5 grid, needs more height
      if (gameKey === "memory_match") {
        const width = Math.max(w * 0.99, 320);
        const height = Math.max(Math.min(h * 0.95, width * 1.4), 420);
        return { width, height };
      }
      const width = Math.max(w * 0.99, 280);
      const height = Math.max(Math.min(h * 0.8, w * 1.15), 320);
      return { width, height };
    }
    if (gameKey === "memory_match") return { width: 420, height: 600 };
    return { width: 520, height: 520 };
  });

  const [showMobileRestart, setShowMobileRestart] = useState(true);
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 600) {
        if (gameKey === "memory_match") {
          const width = Math.max(w * 0.99, 320);
          const height = Math.max(Math.min(h * 0.95, width * 1.4), 420);
          setCanvasSize({ width, height });
        } else {
          setCanvasSize({
            width: Math.max(w * 0.99, 280),
            height: Math.max(Math.min(h * 0.8, w * 1.15), 320)
          });
        }
      } else {
        if (gameKey === "memory_match") setCanvasSize({ width: 420, height: 600 });
        else setCanvasSize({ width: 520, height: 520 });
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gameKey]);

  // Listen for game over to hide restart button on mobile
  useEffect(() => {
    if (window.innerWidth >= 600) return;
    // Listen for a custom event from game logic
    function onGameOver() { setShowMobileRestart(true); }
    function onRestartDone() { setShowMobileRestart(false); }
    window.addEventListener("game-over", onGameOver);
    window.addEventListener("restart-done", onRestartDone);
    setShowMobileRestart(true); // Show on mount/game change
    return () => {
      window.removeEventListener("game-over", onGameOver);
      window.removeEventListener("restart-done", onRestartDone);
    };
  }, [gameKey]);

  return (
    <div className="game-embed">
      <h2 style={{ fontSize: window.innerWidth < 600 && gameKey === "memory_match" ? 18 : 24, margin: window.innerWidth < 600 && gameKey === "memory_match" ? "8px 0 4px 0" : undefined }}>
        Playing {gameKey.replace("_", " ")}
      </h2>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            background: "#222",
            borderRadius: 8,
            marginBottom: window.innerWidth < 600 && gameKey === "memory_match" ? 4 : 16,
            width: canvasSize.width,
            height: canvasSize.height,
            maxWidth: "98vw",
            maxHeight: gameKey === "memory_match" ? "90vw" : "60vw",
            minWidth: 220,
            minHeight: 220,
            touchAction: "manipulation"
          }}
        />
      </div>
      <div className="game-embed-btn-row">
        <button className="pause-btn" onClick={handlePause}>{paused ? "Resume" : "Pause"}</button>
        <button className="menu-btn" onClick={handleMenu}>Main Menu</button>
      </div>
    </div>
  );
}

export default GameEmbed;
