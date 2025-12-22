// Minimal Snake game for demo
export default function runSnake(canvas, controlRef) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = 20;
  let running = true;
  let paused = false;
  let showOverlay = false;
  let overlayMessage = "";
  let snake, dx, dy, food, grow, score, lastDir;

  function reset() {
    snake = [ { x: 100, y: 100 } ];
    dx = size; dy = 0;
    food = { x: 200, y: 200 };
    grow = false;
    score = 0;
    lastDir = 'right';
    showOverlay = false;
    overlayMessage = "";
  }
  reset();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw food
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, size, size);
    // Draw snake
    ctx.fillStyle = "lime";
    for (let s of snake) ctx.fillRect(s.x, s.y, size, size);
    // Draw score
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score, 10, 22);
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

  function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    // Wrap
    if (head.x < 0) head.x = canvas.width - size;
    if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - size;
    if (head.y >= canvas.height) head.y = 0;
    // Self collision
    for (let s of snake) {
      if (s.x === head.x && s.y === head.y) {
        running = false;
        showOverlay = true;
        overlayMessage = `Game Over! Your score: ${score}`;
        return;
      }
    }
    snake.unshift(head);
    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score++;
      food = randomFood();
    } else {
      snake.pop();
    }
  }

  function randomFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * (canvas.width / size)) * size,
        y: Math.floor(Math.random() * (canvas.height / size)) * size
      };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function loop() {
    if (!running) return;
    if (!paused) update();
    draw();
    setTimeout(loop, 120); // slower speed
  }

  function onKey(e) {
    if (e.key === "ArrowUp" && lastDir !== 'down') { dx = 0; dy = -size; lastDir = 'up'; }
    else if (e.key === "ArrowDown" && lastDir !== 'up') { dx = 0; dy = size; lastDir = 'down'; }
    else if (e.key === "ArrowLeft" && lastDir !== 'right') { dx = -size; dy = 0; lastDir = 'left'; }
    else if (e.key === "ArrowRight" && lastDir !== 'left') { dx = size; dy = 0; lastDir = 'right'; }
  }
  window.addEventListener("keydown", onKey);
  // Touch controls for mobile (swipe)
  let touchStartX = null, touchStartY = null;
  canvas.addEventListener("touchstart", function(e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  });
  canvas.addEventListener("touchend", function(e) {
    if (touchStartX === null || touchStartY === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      // Horizontal swipe
      if (dx > 0 && lastDir !== 'left') { dx = size; dy = 0; lastDir = 'right'; }
      else if (dx < 0 && lastDir !== 'right') { dx = -size; dy = 0; lastDir = 'left'; }
    } else if (Math.abs(dy) > 20) {
      // Vertical swipe
      if (dy > 0 && lastDir !== 'up') { dx = 0; dy = size; lastDir = 'down'; }
      else if (dy < 0 && lastDir !== 'down') { dx = 0; dy = -size; lastDir = 'up'; }
    }
    touchStartX = null; touchStartY = null;
  });
  // Overlay click for restart
  canvas.addEventListener("click", function(e) {
    if (!showOverlay) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx > canvas.width/2-60 && mx < canvas.width/2+60 && my > canvas.height/2+10 && my < canvas.height/2+54) {
      reset();
      running = true;
      loop();
    }
  });
  loop();

  if (controlRef && typeof controlRef === "object") {
    controlRef.current = {
      restart: () => {
        running = true;
        paused = false;
        reset();
        loop();
      },
      pause: () => { paused = true; },
      resume: () => { paused = false; },
      isPaused: () => paused
    };
  }
  return () => { running = false; window.removeEventListener("keydown", onKey); canvas.removeEventListener("touchstart", () => {}); canvas.removeEventListener("touchend", () => {}); };
}
