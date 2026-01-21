
import React from "react";

import { gameImages } from "../assets/gameImages";

const colorMap = {
  snake: {
    border: "#22c55e",
    bg: "linear-gradient(135deg, #22c55e22 0%, #1e293b 100%)"
  },
  flappy_bird: {
    border: "#fbbf24",
    bg: "linear-gradient(135deg, #fbbf2422 0%, #1e293b 100%)"
  },
  memory_match: {
    border: "#38bdf8",
    bg: "linear-gradient(135deg, #38bdf822 0%, #1e293b 100%)"
  },
  endless_runner: {
    border: "#a78bfa",
    bg: "linear-gradient(135deg, #a78bfa22 0%, #1e293b 100%)"
  }
};

function GameCard({ title, description, onStart, loading }) {
  // Map title to image key
  const key = title.toLowerCase().replace(/ /g, "_");
  const imgSrc = gameImages[key];
  const accent = colorMap[key] || { border: "#38bdf8", bg: "linear-gradient(135deg, #38bdf822 0%, #1e293b 100%)" };
  return (
    <div
      className="game-card"
      style={{
        border: `2.5px solid ${accent.border}`,
        background: accent.bg,
        boxShadow: `0 10px 25px ${accent.border}33, 0 2px 8px #0003`
      }}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt={title + " game preview"}
          className="game-card-img"
        />
      )}
      <h2 style={{ color: accent.border }}>{title}</h2>
      <p>{description}</p>
      <button onClick={onStart} disabled={loading}>
        {loading ? "Starting..." : "Start"}
      </button>
    </div>
  );
}

export default GameCard;
