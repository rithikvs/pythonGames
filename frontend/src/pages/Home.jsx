import React, { useState } from "react";
import GameCard from "../components/GameCard.jsx";
import GameEmbed from "../components/GameEmbed.jsx";


function Home() {
  const [loadingGame, setLoadingGame] = useState(null);
  const [error, setError] = useState(null);
  const [playMode, setPlayMode] = useState(null); // Only 'normal' mode
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    { key: "snake", title: "Snake", description: "Classic snake game." },
    { key: "flappy_bird", title: "Flappy Bird", description: "Fly through the pipes." },
    { key: "brick_breaker", title: "Brick Breaker", description: "Break all the bricks." },
    { key: "endless_runner", title: "Endless Runner", description: "Run as far as you can." },
  ];

  const handleGameSelect = (gameKey) => {
    setSelectedGame(gameKey);
    setPlayMode(null);
    setError(null);
  };


  const handleModeSelect = () => {
    setPlayMode('normal');
    setError(null);
  };


  const handleExitGame = () => {
    setPlayMode(null);
    setSelectedGame(null);
  };

  return (
    <div className="home">
      <h1>Game Launcher</h1>
      {error && <div className="error">{error}</div>}
      {!selectedGame && (
        <div className="games-grid">
          {games.map((g) => (
            <GameCard
              key={g.key}
              title={g.title}
              description={g.description}
              onStart={() => handleGameSelect(g.key)}
              loading={false}
            />
          ))}
        </div>
      )}


      {selectedGame && !playMode && (
        <div className="mode-select">
          <h2>{games.find(g => g.key === selectedGame)?.title}</h2>
          <p>{games.find(g => g.key === selectedGame)?.description}</p>
          <button onClick={handleModeSelect}>Start</button>
          <button onClick={() => setSelectedGame(null)}>Back</button>
        </div>
      )}

      {playMode === "normal" && selectedGame && (
        <GameEmbed gameKey={selectedGame} onExit={handleExitGame} />
      )}
    </div>
  );
}

export default Home;
