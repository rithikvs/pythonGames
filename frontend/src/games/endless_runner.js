// Chrome Dino-style Endless Runner
export default function runEndlessRunner(canvas, controlRef) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let running = true;
  let paused = false;
  let showOverlay = false;
  let overlayMessage = "";
  let x, y, vy, gravity, jumping, obsX, obsW, obsH, obsType, score, speed, playerHeight, playerDuck, clouds;

  function reset() {
    x = 40;
    y = 420;
    vy = 0;
    gravity = 1.2;
    jumping = false;
    obsX = 480;
    obsW = 20;
    obsH = 40;
    obsType = 0;
    score = 0;
    speed = 6;
    playerHeight = 40;
    playerDuck = false;
    showOverlay = false;
    overlayMessage = "";
    clouds = [
      { x: 200, y: 60 },
      { x: 400, y: 80 }
    ];
  }
  reset();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw clouds
    ctx.fillStyle = "#eee";
    for (let c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 18, 0, 2 * Math.PI);
      ctx.arc(c.x + 15, c.y + 5, 12, 0, 2 * Math.PI);
      ctx.arc(c.x - 15, c.y + 8, 10, 0, 2 * Math.PI);
      ctx.fill();
    }
    // Draw ground
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 460, canvas.width, 20);
    // Draw player (stickman)
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    let px = x + 20;
    let py = y + (40 - playerHeight) + playerHeight;
    // Head
    ctx.beginPath();
    ctx.arc(px, py - playerHeight + 8, 8, 0, 2 * Math.PI);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(px, py - playerHeight + 16);
    ctx.lineTo(px, py - 8);
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(px, py - playerHeight + 22);
    ctx.lineTo(px - 10, py - playerHeight + 30);
    ctx.moveTo(px, py - playerHeight + 22);
    ctx.lineTo(px + 10, py - playerHeight + 30);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(px, py - 8);
    ctx.lineTo(px - 8, py + 12);
    ctx.moveTo(px, py - 8);
    ctx.lineTo(px + 8, py + 12);
    ctx.stroke();
    ctx.restore();
    // Draw obstacle
    ctx.fillStyle = obsType === 1 ? "#0af" : "#f00";
    if (obsType === 1) {
      // Low obstacle (duck)
      ctx.fillRect(obsX, 440, obsW, 20);
    } else {
      // Tall obstacle (jump)
      ctx.fillRect(obsX, 420, obsW, obsH);
    }
    // Draw score
    ctx.fillStyle = "#fff";
    ctx.font = "18px monospace";
    ctx.fillText("Score: " + score, 10, 22);
    // Draw jump/down buttons
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#0af";
    ctx.fillText("[JUMP]", 380, 30);
    ctx.fillText("[DOWN]", 380, 55);
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
    // Speed up smoothly from slow to high
    speed = 3 + 7 * (1 - Math.exp(-score / 30));
    obsX -= speed;
    // Move clouds
    for (let c of clouds) {
      c.x -= speed * 0.3;
      if (c.x < -30) c.x = 520 + Math.random() * 100;
    }
    // New obstacle
    if (obsX < -obsW) {
      obsX = 480 + Math.random() * 100;
      // Randomize obstacle type
      obsType = Math.random() < 0.45 ? 1 : 0; // 45% chance for duck obstacle
      if (obsType === 1) {
        obsW = 30 + Math.random() * 30;
        obsH = 20;
      } else {
        obsW = 20 + Math.random() * 20;
        obsH = 30 + Math.random() * 30;
      }
      score++;
    }
    // Smooth jump (lower gravity, capped vy)
    if (jumping) {
      vy += gravity * 0.7;
      if (vy > 12) vy = 12;
      y += vy;
      if (y >= 420) { y = 420; vy = 0; jumping = false; }
    }
    // Ducking
    if (playerDuck) {
      playerHeight = 20;
    } else {
      playerHeight = 40;
    }
    // Collision
    if (obsType === 1) {
      // Duck obstacle: collide if not ducking
      if (
        x + 40 > obsX && x < obsX + obsW &&
        y + playerHeight > 440 && playerHeight > 20
      ) {
        running = false;
        showOverlay = true;
        overlayMessage = `Game Over! Your score: ${score}`;
        return;
      }
    } else {
      // Tall obstacle: collide if not jumping over
      if (
        x + 40 > obsX && x < obsX + obsW &&
        y + playerHeight > 420
      ) {
        running = false;
        showOverlay = true;
        overlayMessage = `Game Over! Your score: ${score}`;
        return;
      }
    }
  }

  function loop() {
    if (!running) return;
    if (!paused) update();
    draw();
    requestAnimationFrame(loop);
  }
  function onKey(e) {
    if ((e.code === "Space" || e.key === "ArrowUp") && !jumping && y >= 420) { vy = -20; jumping = true; }
    if (e.key === "ArrowDown" || e.key === "s") { playerDuck = true; }
  }
  function onKeyUp(e) {
    if (e.key === "ArrowDown" || e.key === "s") { playerDuck = false; }
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);
  // Add clickable jump/down buttons
  canvas.addEventListener("click", function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (showOverlay) {
      if (mx > canvas.width/2-60 && mx < canvas.width/2+60 && my > canvas.height/2+10 && my < canvas.height/2+54) {
        reset();
        running = true;
        loop();
        return;
      }
    }
    if (mx > 370 && mx < 440 && my > 10 && my < 35) {
      // JUMP
      if (!jumping && y >= 420) { vy = -20; jumping = true; }
    }
    if (mx > 370 && mx < 440 && my > 35 && my < 60) {
      // DOWN
      playerDuck = true;
      setTimeout(() => { playerDuck = false; }, 300);
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
  return () => {
    running = false;
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("click", () => {});
  };
}
