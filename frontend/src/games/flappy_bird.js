// Ultra Smooth & Slow Flappy Bird (Delta-Time Based)
export default function runFlappyBird(canvas, controlRef) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let running = true;
  let paused = false;
  let showOverlay = false;
  let overlayMessage = "";

  // ---------- TIME ----------
  let lastTime = performance.now();

  // ---------- BIRD ----------
  const birdX = 80;
  const birdR = 20;
  let y, vy;

  // Tuned physics (slow & smooth)
  const gravity = 1200;   // px/s²
  const jump = -420;      // px/s

  // ---------- GAME ----------
  let score;
  let pipes = [];
  let canJump = true;

  // ---------- PIPE ----------
  const PIPE_WIDTH = 50;
  const PIPE_SPEED = 120; // px/s (slow)
  const PIPE_GAP = 170;

  function makePipe() {
    const top = Math.random() * (canvas.height - PIPE_GAP - 120) + 60;
    return { x: canvas.width, top };
  }

  // ---------- RESET ----------
  function reset() {
    y = canvas.height / 2;
    vy = 0;
    score = 0;
    pipes = [makePipe()];
    lastTime = performance.now();
    showOverlay = false;
    overlayMessage = "";
  }
  reset();

  // ---------- DRAW ----------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pipes with caps
    for (let p of pipes) {
      // Main pipe color
      ctx.fillStyle = "#4ade80";
      // Top pipe
      ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
      // Bottom pipe
      ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, canvas.height - (p.top + PIPE_GAP));

      // Cap color
      ctx.fillStyle = "#22c55e";
      // Top cap
      ctx.fillRect(p.x - 4, p.top - 12, PIPE_WIDTH + 8, 12);
      // Bottom cap
      ctx.fillRect(p.x - 4, p.top + PIPE_GAP, PIPE_WIDTH + 8, 12);
      // Optional: rounded cap
      ctx.beginPath();
      ctx.arc(p.x + PIPE_WIDTH / 2, p.top - 6, PIPE_WIDTH / 2 + 2, Math.PI, 2 * Math.PI);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x + PIPE_WIDTH / 2, p.top + PIPE_GAP + 6, PIPE_WIDTH / 2 + 2, 0, Math.PI);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
    }

    // Bird
    ctx.save();
    ctx.translate(birdX, y);

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(0, 0, birdR, birdR * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, -5, birdR * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(9, -5, birdR * 0.11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.moveTo(birdR * 0.8, 0);
    ctx.lineTo(birdR * 1.2, -4);
    ctx.lineTo(birdR * 1.2, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score, 10, 22);

    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("RESUME", canvas.width / 2, canvas.height / 2);
      ctx.textAlign = "left";
    }
    // Game Over overlay
    if (showOverlay) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(overlayMessage, canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = "22px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(canvas.width/2-60, canvas.height/2+10, 120, 44);
      ctx.fillStyle = "#fff";
      ctx.font = "22px sans-serif";
      ctx.fillText("Restart", canvas.width/2, canvas.height/2+40);
      ctx.textAlign = "left";
    }
  }

  // ---------- UPDATE ----------
  function update(dt) {
    // Bird physics
    vy += gravity * dt;
    y += vy * dt;

    // Ceiling / ground
    if (y < birdR) {
      y = birdR;
      vy = 0;
    }
    if (y > canvas.height - birdR) endGame();

    // Pipes
    for (let p of pipes) p.x -= PIPE_SPEED * dt;

    if (pipes[pipes.length - 1].x < canvas.width - 280) {
      pipes.push(makePipe());
    }

    if (pipes[0].x < -PIPE_WIDTH) {
      pipes.shift();
      score++;
    }

    // Collision
    for (let p of pipes) {
      if (
        birdX + birdR > p.x &&
        birdX - birdR < p.x + PIPE_WIDTH
      ) {
        if (
          y - birdR < p.top ||
          y + birdR > p.top + PIPE_GAP
        ) {
          endGame();
          return;
        }
      }
    }
  }

  function endGame() {
    running = false;
    showOverlay = true;
    overlayMessage = `Game Over! Your score: ${score}`;
    // Dispatch game-over event for mobile
    if (window.innerWidth < 600) {
      window.dispatchEvent(new Event("game-over"));
    }
  }

  // ---------- LOOP ----------
  function loop(time) {
    if (!running) return;

    let dt = (time - lastTime) / 1000;
    lastTime = time;

    // Cap delta (prevents speed jumps)
    dt = Math.min(dt, 0.02);

    if (!paused) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- INPUT ----------
  function onKey(e) {
    if (e.code === "Space" && !paused && canJump) {
      vy = jump;
      canJump = false;
      setTimeout(() => (canJump = true), 120);
    }
    if (e.code === "KeyP") paused = !paused;
  }

  window.addEventListener("keydown", onKey);
  // Touch: tap to jump
  canvas.addEventListener("touchstart", function(e) {
    if (!paused && canJump) {
      vy = jump;
      canJump = false;
      setTimeout(() => (canJump = true), 120);
    }
  });
  // Overlay click for restart
  function handleRestart() {
    running = true;
    paused = false;
    reset();
    requestAnimationFrame(loop);
    if (window.innerWidth < 600) {
      setTimeout(() => window.dispatchEvent(new Event("restart-done")), 0);
    }
  }
  canvas.addEventListener("click", function(e) {
    if (!showOverlay) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const my = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    if (mx > canvas.width/2-60 && mx < canvas.width/2+60 && my > canvas.height/2+10 && my < canvas.height/2+54) {
      handleRestart();
    }
  });
  canvas.addEventListener("touchstart", function(e) {
    if (!showOverlay) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.touches[0].clientX - rect.left;
    const my = e.touches[0].clientY - rect.top;
    if (mx > canvas.width/2-60 && mx < canvas.width/2+60 && my > canvas.height/2+10 && my < canvas.height/2+54) {
      handleRestart();
    }
  });
  requestAnimationFrame(loop);

  // ---------- REACT CONTROLS ----------
  if (controlRef && typeof controlRef === "object") {
    controlRef.current = {
      restart: handleRestart,
      pause: () => (paused = true),
      resume: () => (paused = false),
      isPaused: () => paused
    };
  }

  // ---------- CLEANUP ----------
  return () => {
    running = false;
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("touchstart", () => {});
  };
}
