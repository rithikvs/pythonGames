// Bubble Shooter Game (Canvas, Pause/Resume/Restart support)
const COLORS = ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6", "#1abc9c"];
const ROWS = 7, COLS = 12, RADIUS = 18, SHOOTER_Y = 420;
const SHOOT_SPEED = 520;
const NEW_ROW_INTERVAL = 25000; // 25 seconds

function randomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

export default function runBubbleShooter(canvas, controlRef) {
    // Responsive canvas for mobile sharpness
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let running = true, paused = false, showOverlay = false, overlayMessage = "";
  let grid, shooter, shot, score, lastBubbleTime, lastRowTime;
  let fallingBubbles = [];

  function reset() {
    // Create grid of bubbles
    grid = [];
    for (let r = 0; r < ROWS; ++r) {
      let row = [];
      for (let c = 0; c < COLS; ++c) {
        if (r < 5) row.push({ color: randomColor(), x: c, y: r });
        else row.push(null);
      }
      grid.push(row);
    }
    shooter = { x: Math.floor(COLS/2), color: randomColor(), angle: 0 };
    shot = null;
    score = 0;
    lastBubbleTime = Date.now();
    showOverlay = false;
    overlayMessage = "";
    lastRowTime = Date.now();
    fallingBubbles = [];
  }
  reset();

  // --- Utility ---
  function drawBubble(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function gridToXY(col, row) {
    let x = 40 + col * RADIUS * 2 + (row % 2 ? RADIUS : 0);
    let y = 40 + row * RADIUS * 1.75;
    return { x, y };
  }

  // --- Drawing ---
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    for (let r = 0; r < ROWS; ++r) {
      for (let c = 0; c < COLS; ++c) {
        let b = grid[r][c];
        if (b) {
          let { x, y } = gridToXY(c, r);
          drawBubble(x, y, b.color);
        }
      }
    }
    // Draw shooter
    let sx = canvas.width / 2, sy = SHOOTER_Y;
    drawBubble(sx, sy, shooter.color);
    // Draw aim line (to cursor if available)
    ctx.save();
    ctx.strokeStyle = "#888";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    if (typeof shooter.aimX === 'number' && typeof shooter.aimY === 'number') {
      ctx.lineTo(shooter.aimX, shooter.aimY);
    } else {
      let aimX = sx + Math.cos(shooter.angle) * 120, aimY = sy + Math.sin(shooter.angle) * 120;
      ctx.lineTo(aimX, aimY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Draw shot bubble
    if (shot) drawBubble(shot.x, shot.y, shot.color);
    // Draw falling bubbles
    for (let fb of fallingBubbles) {
      drawBubble(fb.x, fb.y, fb.color);
    }
    // Draw score
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score, 10, 24);
    // Overlay
    if (showOverlay) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "32px sans-serif";
      ctx.fillText(overlayMessage, canvas.width/2-ctx.measureText(overlayMessage).width/2, canvas.height/2);
    }
  }

  // --- Game Logic ---
  function update(dt) {
    if (!running || paused) return;
    // Add new row every 25s
    if (Date.now() - lastRowTime > NEW_ROW_INTERVAL) {
      // Remove bottom row if grid is full
      if (grid.length >= ROWS) grid.pop();
      // Add new row at top
      let newRow = [];
      for (let c = 0; c < COLS; ++c) newRow.push({ color: randomColor(), x: c, y: 0 });
      grid.unshift(newRow);
      // Update y for all bubbles
      for (let r = 0; r < grid.length; ++r) {
        for (let c = 0; c < COLS; ++c) {
          if (grid[r][c]) grid[r][c].y = r;
        }
      }
      lastRowTime = Date.now();
    }
        // Animate falling bubbles
        for (let fb of fallingBubbles) {
          fb.vy += 1200 * dt;
          fb.y += fb.vy * dt;
        }
        fallingBubbles = fallingBubbles.filter(fb => fb.y < canvas.height + RADIUS);
    // Move shot
    if (shot) {
      shot.x += Math.cos(shot.angle) * SHOOT_SPEED * dt;
      shot.y += Math.sin(shot.angle) * SHOOT_SPEED * dt;
      // Bounce off walls
      if (shot.x < RADIUS) {
        shot.x = RADIUS;
        shot.angle = Math.PI - shot.angle;
      } else if (shot.x > canvas.width - RADIUS) {
        shot.x = canvas.width - RADIUS;
        shot.angle = Math.PI - shot.angle;
      }
      // Check collision with grid
      let hit = false;
      for (let r = 0; r < ROWS && !hit; ++r) {
        for (let c = 0; c < COLS && !hit; ++c) {
          let b = grid[r][c];
          if (b) {
            let { x, y } = gridToXY(c, r);
            let dist = Math.hypot(shot.x - x, shot.y - y);
            if (dist < RADIUS * 2 - 2) {
              // Place bubble in nearest empty spot
              let place = findNearestEmpty(shot.x, shot.y);
              if (place) {
                grid[place.row][place.col] = { color: shot.color, x: place.col, y: place.row };
                popConnected(place.col, place.row, shot.color);
              }
              shot = null;
              hit = true;
            }
          }
        }
      }
      // Hit top
      if (shot && shot.y < 40 + RADIUS) {
        let place = findNearestEmpty(shot.x, shot.y);
        if (place) {
          grid[place.row][place.col] = { color: shot.color, x: place.col, y: place.row };
          popConnected(place.col, place.row, shot.color);
        }
        shot = null;
      }
    }
  }

  // Find nearest empty grid cell
  function findNearestEmpty(x, y) {
    let minDist = 9999, best = null;
    for (let r = 0; r < ROWS; ++r) {
      for (let c = 0; c < COLS; ++c) {
        if (!grid[r][c]) {
          let pos = gridToXY(c, r);
          let d = Math.hypot(x - pos.x, y - pos.y);
          if (d < minDist) { minDist = d; best = { row: r, col: c }; }
        }
      }
    }
    return best;
  }

  // Pop all connected bubbles of the same color
  function popConnected(col, row, color) {
    let visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    let toPop = [];
    function dfs(c, r) {
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
      if (visited[r][c] || !grid[r][c] || grid[r][c].color !== color) return;
      visited[r][c] = true;
      toPop.push({c, r});
      // 6 directions (hex grid)
      dfs(c+1, r); dfs(c-1, r); dfs(c, r+1); dfs(c, r-1);
      if (r % 2 === 0) { dfs(c-1, r-1); dfs(c-1, r+1); }
      else { dfs(c+1, r-1); dfs(c+1, r+1); }
    }
    dfs(col, row);
    if (toPop.length >= 3) {
      for (let {c, r} of toPop) grid[r][c] = null;
      score += toPop.length * 10;
      // After popping, find and drop disconnected bubbles
      dropDisconnected();
    }
    // Drop disconnected bubbles (not connected to top row)
    function dropDisconnected() {
      let visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
      // Mark all bubbles connected to top
      function dfs(c, r) {
        if (c < 0 || c >= COLS || r < 0 || r >= grid.length) return;
        if (visited[r][c] || !grid[r][c]) return;
        visited[r][c] = true;
        dfs(c+1, r); dfs(c-1, r); dfs(c, r+1); dfs(c, r-1);
        if (r % 2 === 0) { dfs(c-1, r-1); dfs(c-1, r+1); }
        else { dfs(c+1, r-1); dfs(c+1, r+1); }
      }
      for (let c = 0; c < COLS; ++c) if (grid[0][c]) dfs(c, 0);
      // Any unvisited bubble is disconnected
      for (let r = 0; r < grid.length; ++r) {
        for (let c = 0; c < COLS; ++c) {
          if (grid[r][c] && !visited[r][c]) {
            // Animate falling
            let { x, y } = gridToXY(c, r);
            fallingBubbles.push({ x, y, color: grid[r][c].color, vy: 0 });
            grid[r][c] = null;
          }
        }
      }
    }
  }

  // --- Controls ---
  function shoot(angle) {
    if (shot || paused || showOverlay) return;
    let sx = canvas.width / 2, sy = SHOOTER_Y;
    shot = {
      x: sx,
      y: sy,
      color: shooter.color,
      angle: angle
    };
    shooter.color = randomColor();
  }

  // --- Mouse ---
  function aimAt(mx, my) {
    let rect = canvas.getBoundingClientRect();
    let dpr = window.devicePixelRatio || 1;
    mx = (mx - rect.left) * dpr;
    my = (my - rect.top) * dpr;
    let dx = mx - canvas.width/2, dy = my - SHOOTER_Y;
    shooter.angle = Math.atan2(dy, dx);
    shooter.aimX = mx/dpr;
    shooter.aimY = my/dpr;
    // Clamp angle to full 180 degrees (left to right)
    if (shooter.angle < -Math.PI + 0.1) shooter.angle = -Math.PI + 0.1;
    if (shooter.angle > -0.1) shooter.angle = -0.1;
  }
  function onMouseMove(e) {
    aimAt(e.clientX, e.clientY);
  }
  function onMouseDown(e) {
    if (paused || showOverlay) return;
    shoot(shooter.angle);
  }
  function onTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      e.preventDefault();
      aimAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  }
  function onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      e.preventDefault();
      aimAt(e.touches[0].clientX, e.touches[0].clientY);
      if (!paused && !showOverlay) shoot(shooter.angle);
    }
  }
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });

  // --- Main Loop ---
  let last = performance.now();
  function loop(now) {
    if (!running) return;
    let dt = Math.min((now - last) / 1000, 0.035);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // --- Controls for Pause/Resume/Restart ---
  if (controlRef) {
    controlRef.current = {
      pause: () => { paused = true; showOverlay = true; overlayMessage = "Paused"; },
      resume: () => { paused = false; showOverlay = false; overlayMessage = ""; },
      restart: () => { reset(); paused = false; showOverlay = false; overlayMessage = ""; },
    };
  }

  // --- Cleanup ---
  return () => {
    running = false;
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener('resize', resizeCanvas);
  };
}
