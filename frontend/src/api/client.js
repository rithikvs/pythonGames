const API_BASE = "https://pythongames-1.onrender.com";
export async function launchGame(gameKey) {
  const res = await fetch(`${API_BASE}/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: gameKey }),
  });

  if (!res.ok) {
    let message = "Failed to launch game";
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch (e) {}
    throw new Error(message);
  }

  return res.json();
}
