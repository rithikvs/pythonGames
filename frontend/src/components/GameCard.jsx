import React from "react";

function GameCard({ title, description, onStart, loading }) {
  return (
    <div className="game-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button onClick={onStart} disabled={loading}>
        {loading ? "Starting..." : "Start"}
      </button>
    </div>
  );
}

export default GameCard;
