// Brick Breaker Game
//
// Drag the cursor left or right to move the paddle smoothly.
// The ball breaks only one brick at a time on collision and then changes direction.
// If the ball hits the paddle, it bounces back upward based on the contact position.
// Missing the ball ends the round.
// Use the Pause button to temporarily stop the game, Resume to continue from the same state, or Restart to begin a new game.
// Break all bricks to win the level.
export default function runBrickBreaker(canvas, controlRef) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let running = true;
  let paused = false;
  let showOverlay = false;
  let overlayMessage = "";

  const paddleW = 80, paddleH = 10, ballSize = 20;
  let paddleY = canvas.height - paddleH - 10; // Always 10px above bottom

  const brickRowCount = 5, brickColCount = 7;
  const brickW = 60, brickH = 20;
  const brickPadding = 10, brickOffsetTop = 40, brickOffsetLeft = 20;

  let x, y, dx, dy, paddleX, bricks, score;
  const INITIAL_DX = 2;
  const INITIAL_DY = -2;
  const SPEED_INCREMENT = 0.15;

  // Drag state
  let dragging = false;
  let dragOffsetX = 0;

  // ---------- RESET ----------
  function reset() {
    // Recalculate paddleY in case canvas size changed
    paddleY = canvas.height - paddleH - 10;
    x = canvas.width / 2 - ballSize / 2;
    y = paddleY - ballSize - 30;
    dx = INITIAL_DX;
    dy = INITIAL_DY;
    paddleX = canvas.width / 2 - paddleW / 2;
    score = 0;
    showOverlay = false;
    overlayMessage = "";

    bricks = [];
    for (let c = 0; c < brickColCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        bricks.push({
          x: c * (brickW + brickPadding) + brickOffsetLeft,
          y: r * (brickH + brickPadding) + brickOffsetTop,
          status: 1
        });
      }
    }
  }
  reset();

  // ---------- DRAW ----------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bricks
    for (let b of bricks) {
      if (b.status) {
        ctx.fillStyle = "#f59e42";
        ctx.fillRect(b.x, b.y, brickW, brickH);
      }
    }

    // Ball
    ctx.fillStyle = "#09f";
    ctx.fillRect(x, y, ballSize, ballSize);

    // Paddle
    ctx.fillStyle = "#fff";
    ctx.fillRect(paddleX, paddleY, paddleW, paddleH);

    // Score
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score, 10, 22);

    // Pause overlay
    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
      ctx.textAlign = "left";
    }
    // Game Over/Win overlay
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
  function update() {
    x += dx;
    y += dy;

    // Wall collisions
    if (x < 0 || x > canvas.width - ballSize) dx = -dx;
    if (y < 0) dy = -dy;

    // Paddle collision (bounce upward based on contact position)
    if (
      y + ballSize > paddleY &&
      x + ballSize > paddleX &&
      x < paddleX + paddleW &&
      dy > 0 // Only bounce if moving downward
    ) {
      // Calculate hit position (from -1 to 1)
      const hit = ((x + ballSize / 2) - (paddleX + paddleW / 2)) / (paddleW / 2);
      // Calculate current speed
      const speed = Math.sqrt(dx * dx + dy * dy) + SPEED_INCREMENT;
      // Bounce angle: max 60deg left/right
      const maxBounce = Math.PI / 3;
      const angle = hit * maxBounce;
      dx = speed * Math.sin(angle);
      dy = -Math.abs(speed * Math.cos(angle));
      // Clamp ball inside paddle to avoid sticking
      y = paddleY - ballSize - 1;
    }

    // Bottom (game over)
    if (y > canvas.height) {
      running = false;
      showOverlay = true;
      overlayMessage = `Game Over! Your score: ${score}`;
      // Dispatch game-over event for mobile
      if (window.innerWidth < 600) {
        window.dispatchEvent(new Event("game-over"));
      }
      return;
    }

    // Brick collision (only one brick per bounce, with correct bounce direction)
    if (!update.lastHitBrick) {
      let hitBrick = null;
      for (let b of bricks) {
        if (
          b.status &&
          x + ballSize > b.x &&
          x < b.x + brickW &&
          y + ballSize > b.y &&
          y < b.y + brickH
        ) {
          hitBrick = b;
          break;
        }
      }
      if (hitBrick) {
        hitBrick.status = 0;
        score++;
        // Determine collision side for bounce
        const prevX = x - dx;
        const prevY = y - dy;
        let horizontal = false, vertical = false;
        if (
          prevX + ballSize <= hitBrick.x ||
          prevX >= hitBrick.x + brickW
        ) {
          horizontal = true;
        }
        if (
          prevY + ballSize <= hitBrick.y ||
          prevY >= hitBrick.y + brickH
        ) {
          vertical = true;
        }
        const speed = Math.sqrt(dx * dx + dy * dy) + SPEED_INCREMENT;
        if (horizontal && !vertical) {
          dx = -dx;
          // Normalize speed
          const norm = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / norm) * speed;
          dy = (dy / norm) * speed;
        } else if (vertical && !horizontal) {
          dy = -dy;
          // Normalize speed
          const norm = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / norm) * speed;
          dy = (dy / norm) * speed;
        } else {
          // Default: reverse dy
          dy = -dy;
          const norm = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / norm) * speed;
          dy = (dy / norm) * speed;
        }
        update.lastHitBrick = hitBrick;
      }
    } else {
      // Check if ball is no longer colliding with the last hit brick
      const b = update.lastHitBrick;
      if (!(
        x + ballSize > b.x &&
        x < b.x + brickW &&
        y + ballSize > b.y &&
        y < b.y + brickH
      )) {
        update.lastHitBrick = null;
      }
    }

    // Win
    if (score === brickRowCount * brickColCount) {
      running = false;
      showOverlay = true;
      overlayMessage = `You Win! Your score: ${score}`;
    }
  }

  // ---------- LOOP ----------
  function loop() {
    if (!running) return;
    if (!paused) update();
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- MOUSE DRAG CONTROLS ----------
  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (
      my >= paddleY &&
      my <= paddleY + paddleH &&
      mx >= paddleX &&
      mx <= paddleX + paddleW
    ) {
      dragging = true;
      dragOffsetX = mx - paddleX;
    }
  }

  function onMouseMove(e) {
    if (!dragging || paused) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    paddleX = mx - dragOffsetX;

    // Clamp paddle
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleW) {
      paddleX = canvas.width - paddleW;
    }
  }

  function onMouseUp() {
    dragging = false;
  }

  // ---------- KEYBOARD (OPTIONAL) ----------
  function onKey(e) {
    if (e.key === "ArrowLeft") paddleX -= 20;
    if (e.key === "ArrowRight") paddleX += 20;

    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleW) {
      paddleX = canvas.width - paddleW;
    }
  }

  // ---------- LISTENERS ----------
  window.addEventListener("keydown", onKey);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  // Touch drag for paddle (smooth, inertia)
  let touchDragging = false;
  let lastTouchX = 0;
  let paddleVX = 0;
  canvas.addEventListener("touchstart", function(e) {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;
      // Allow swipe anywhere in bottom third of canvas
      if (my > canvas.height * 2 / 3) {
        touchDragging = true;
        lastTouchX = mx;
        paddleVX = 0;
      }
    }
  });
  canvas.addEventListener("touchmove", function(e) {
    if (!touchDragging || paused) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.touches[0].clientX - rect.left;
    // Directly set paddle center to finger x, clamped
    paddleX = mx - paddleW / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleW) paddleX = canvas.width - paddleW;
    lastTouchX = mx;
    paddleVX = 0;
  });
  canvas.addEventListener("touchend", function() {
    touchDragging = false;
    paddleVX = 0;
  });
  // Inertia for paddle after drag
  function animatePaddle() {
    if (!touchDragging && Math.abs(paddleVX) > 0.5) {
      paddleX += paddleVX;
      paddleVX *= 0.85;
      if (paddleX < 0) paddleX = 0;
      if (paddleX > canvas.width - paddleW) paddleX = canvas.width - paddleW;
    }
    requestAnimationFrame(animatePaddle);
  }
  animatePaddle();
  // Overlay click for restart
  function handleRestart() {
    running = true;
    paused = false;
    reset();
    loop();
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

  loop();

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
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    canvas.removeEventListener("touchstart", () => {});
    canvas.removeEventListener("touchmove", () => {});
    canvas.removeEventListener("touchend", () => {});
  };
}
