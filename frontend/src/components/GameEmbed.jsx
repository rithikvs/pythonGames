import React, { useEffect, useRef, useState } from "react";

// This is a placeholder for each game. Replace with real game logic or import.
const gameScripts = {
  snake: () => import("../games/snake.js"),
  flappy_bird: () => import("../games/flappy_bird.js"),
  bubble_shooter: () => import("../games/bubble_shooter.js"),
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
    // For mobile, use almost full width and keep aspect ratio
    if (w < 700) {
      let width = Math.max(w * 0.98, 220);
      let height = width * 1.1;
      // Limit height to fit viewport
      if (height > h * 0.8) {
        height = h * 0.8;
        width = height / 1.1;
      }
      // Special case for memory_match
      if (gameKey === "memory_match") {
        height = Math.max(Math.min(h * 0.95, width * 1.4), 320);
      }
      return { width, height };
    }
    if (gameKey === "memory_match") return { width: 420, height: 600 };
    return { width: 520, height: 520 };
  });

  const [showRestart, setShowRestart] = useState(false);
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 700) {
        let width = Math.max(w * 0.98, 220);
        let height = width * 1.1;
        if (height > h * 0.8) {
          height = h * 0.8;
          width = height / 1.1;
        }
        if (gameKey === "memory_match") {
          height = Math.max(Math.min(h * 0.95, width * 1.4), 320);
        }
        setCanvasSize({ width, height });
      } else {
        if (gameKey === "memory_match") setCanvasSize({ width: 420, height: 600 });
        else setCanvasSize({ width: 520, height: 520 });
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gameKey]);

  // Listen for game over to show restart button and for main menu event (bb-main-menu)
  useEffect(() => {
    function onGameOver() { setShowRestart(true); }
    function onRestartDone() { setShowRestart(false); }
    function onMainMenu() { if (typeof onExit === "function") onExit(); }
    window.addEventListener("game-over", onGameOver);
    window.addEventListener("restart-done", onRestartDone);
    window.addEventListener("bb-main-menu", onMainMenu);
    setShowRestart(false); // Hide on mount/game change
    return () => {
      window.removeEventListener("game-over", onGameOver);
      window.removeEventListener("restart-done", onRestartDone);
      window.removeEventListener("bb-main-menu", onMainMenu);
    };
  }, [gameKey, onExit]);

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
            marginBottom: window.innerWidth < 700 && gameKey === "memory_match" ? 4 : 16,
            width: canvasSize.width,
            height: canvasSize.height,
            maxWidth: "99vw",
            maxHeight: "80vh",
            minWidth: 180,
            minHeight: 180,
            touchAction: "manipulation"
          }}
        />
      </div>
      <div className="game-embed-btn-row" style={{ display: 'flex', flexDirection: window.innerWidth < 600 ? 'column' : 'row', alignItems: 'center', gap: window.innerWidth < 600 ? 8 : 0 }}>
        <button className="pause-btn" onClick={handlePause} style={{ width: window.innerWidth < 600 ? '100%' : undefined }}>{paused ? "Resume" : "Pause"}</button>
        {showRestart && (
          <button className="pause-btn" style={{ background: "#ef4444", width: window.innerWidth < 600 ? '100%' : undefined, marginLeft: window.innerWidth < 600 ? 0 : 8, marginTop: window.innerWidth < 600 ? 8 : 0 }} onClick={handleRestart}>Restart</button>
        )}
        <button className="menu-btn" onClick={handleMenu} style={{ width: window.innerWidth < 600 ? '100%' : undefined }}>{"Main Menu"}</button>
      </div>
    </div>
  );
}

export default GameEmbed;
