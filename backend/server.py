from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import sys
import os

app = Flask(__name__)

# DEV-ONLY: allow any origin for /launch to avoid CORS issues with changing dev ports
CORS(
    app,
    resources={r"/launch": {"origins": "*"}},
    supports_credentials=False,
    allow_headers=["Content-Type"],
    methods=["GET", "POST", "OPTIONS"],
)

GAMES = {
    "snake": "snake.py",
    "flappy_bird": "flappy_bird.py",
    "brick_breaker": "brick_breaker.py",
    "endless_runner": "endless_runner.py",
}


@app.route("/launch", methods=["POST", "OPTIONS"])
def launch_game():
    # Handle preflight
    if request.method == "OPTIONS":
        # Flask-CORS will automatically add the proper CORS headers
        return ("", 204)

    data = request.get_json(force=True)
    game_key = data.get("game")

    if game_key not in GAMES:
        return jsonify({"error": "Unknown game"}), 400

    script_path = os.path.join(os.path.dirname(__file__), "games", GAMES[game_key])

    # Start the game as a separate process
    subprocess.Popen([sys.executable, script_path])

    return jsonify({"status": "launched", "game": game_key}), 200


if __name__ == "__main__":
    # Listen on all interfaces so localhost/127.0.0.1 both work
    app.run(host="0.0.0.0", port=5000)