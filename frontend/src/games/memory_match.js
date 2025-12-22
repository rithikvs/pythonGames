// Memory Matching Puzzle Game (Emoji)
// Replaces endless runner
export default function runMemoryMatch(canvas, controlRef) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // --- CONFIG ---
  // 10 unique emojis, each will be paired (no repeats)
  const EMOJIS = [
    "🍎", "🚗", "🐶", "🌟", "🎲",
    "🎵", "⚽", "🍕", "🎈", "🦋"
  ];
  const PAIRS = 10;
  const ROWS = 4, COLS = 5;
  // Card size and gap will be calculated based on canvas size
  let CARD_W = 64, CARD_H = 84, GAP_X = 18, GAP_Y = 18;
  let gridOffsetX = 0, gridOffsetY = 0;
  const FLIP_DURATION = 320; // ms
  const FLIP_ANGLE = Math.PI;

  // --- STATE ---
  let cards = [];
  let flipped = [];
  let matched = [];
  let animating = false;
  let running = true;
  let paused = false;
  let showOverlay = false;
  let overlayMessage = "";
  let matches = 0;
  let lastTimestamp = 0;
  let flipStart = null;
  let flipCards = [];

  // --- INIT ---
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function reset() {
    let deck = shuffle([...EMOJIS, ...EMOJIS]); // 10 unique, each appears twice
    // Calculate card size and gap to fit all cards in canvas, centered vertically and horizontally
    const totalGapX = canvas.width * 0.08;
    const totalGapY = canvas.height * 0.08;
    GAP_X = totalGapX / (COLS + 1);
    GAP_Y = totalGapY / (ROWS + 1);
    CARD_W = (canvas.width - (GAP_X * (COLS + 1))) / COLS;
    CARD_H = (canvas.height - (GAP_Y * (ROWS + 1))) / ROWS;
    // Center the grid
    const gridW = COLS * CARD_W + (COLS + 1) * GAP_X;
    const gridH = ROWS * CARD_H + (ROWS + 1) * GAP_Y;
    gridOffsetX = (canvas.width - gridW) / 2;
    gridOffsetY = (canvas.height - gridH) / 2;
    cards = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      let row = Math.floor(i / COLS);
      let col = i % COLS;
      cards.push({
        emoji: deck[i],
        x: gridOffsetX + col * (CARD_W + GAP_X) + GAP_X,
        y: gridOffsetY + row * (CARD_H + GAP_Y) + GAP_Y,
        flipped: false,
        matched: false,
        anim: 0 // 0: face down, 1: face up
      });
    }
    flipped = [];
    matched = [];
    animating = false;
    running = true;
    paused = false;
    showOverlay = false;
    overlayMessage = "";
    matches = 0;
    lastTimestamp = 0;
    flipStart = null;
    flipCards = [];
  }
  reset();

  // --- DRAW ---
  function drawCard(card, t) {
    ctx.save();
    ctx.translate(card.x + CARD_W / 2, card.y + CARD_H / 2);
    ctx.rotate(0);
    // Mobile: larger shadow, more rounded, bolder emoji
    const isMobile = window.innerWidth < 600;
    ctx.shadowColor = isMobile ? "#0006" : "#0008";
    ctx.shadowBlur = isMobile ? 16 : 8;
    ctx.shadowOffsetY = isMobile ? 8 : 4;
    let angle = t * FLIP_ANGLE;
    ctx.scale(Math.cos(angle), 1);
    ctx.beginPath();
    ctx.roundRect(
      -CARD_W / 2,
      -CARD_H / 2,
      CARD_W,
      CARD_H,
      isMobile ? Math.min(CARD_W, CARD_H) * 0.28 : Math.min(CARD_W, CARD_H) * 0.18
    );
    ctx.fillStyle = card.flipped || card.matched ? "#fff" : "#22c55e"; // green when face down
    ctx.fill();
    ctx.strokeStyle = card.flipped || card.matched ? "#22c55e" : "#fff";
    ctx.lineWidth = Math.max(2, Math.min(CARD_W, CARD_H) * (isMobile ? 0.09 : 0.06));
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (t > 0.5 || card.flipped || card.matched) {
      // Make emoji fit card better on mobile
      const fontSize = isMobile
        ? Math.floor(Math.min(CARD_W, CARD_H) * 0.78)
        : Math.floor(CARD_H * 0.55);
      ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#222";
      ctx.fillText(card.emoji, 0, 2);
    }
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cards.length; i++) {
      let card = cards[i];
      let t = card.anim || 0;
      drawCard(card, t);
    }
    // Overlay
    const isMobile = window.innerWidth < 600;
    if (paused) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "26px sans-serif" : "32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
      ctx.textAlign = "left";
    }
    if (showOverlay) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "26px sans-serif" : "32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(overlayMessage, canvas.width / 2, canvas.height / 2 - (isMobile ? 12 : 20));
      ctx.font = isMobile ? "18px sans-serif" : "22px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(canvas.width/2-60, canvas.height/2+10, 120, 44);
      ctx.fillStyle = "#fff";
      ctx.font = isMobile ? "18px sans-serif" : "22px sans-serif";
      ctx.fillText("Restart", canvas.width/2, canvas.height/2+40);
      ctx.textAlign = "left";
    }
  }

  // --- ANIMATION LOOP ---
  function animate(time) {
    if (!running) return;
    if (!paused) {
      if (animating && flipCards.length) {
        let elapsed = time - flipStart;
        let t = Math.min(elapsed / FLIP_DURATION, 1);
        for (let c of flipCards) c.anim = t;
        if (t >= 1) {
          // If two cards are flipped, check for match
          if (flipped.length === 2) {
            let [a, b] = flipped;
            cards[a].flipped = cards[b].flipped = true;
            if (cards[a].emoji === cards[b].emoji) {
              cards[a].matched = cards[b].matched = true;
              matches++;
              if (matches === PAIRS) {
                running = false;
                showOverlay = true;
                overlayMessage = "You Win!";
              }
              flipped = [];
              animating = false;
              flipCards = [];
            } else {
              // Animate flip back
              setTimeout(() => {
                cards[a].flipped = cards[b].flipped = false;
                cards[a].anim = cards[b].anim = 0;
                flipped = [];
                animating = false;
                flipCards = [];
                draw();
              }, 700);
            }
          } else {
            // Only one card flipped
            for (let c of flipCards) c.flipped = true;
            animating = false;
            flipCards = [];
          }
        }
      }
    }
    draw();
    requestAnimationFrame(animate);
  }

  // --- GAME LOGIC ---
  function cardAt(mx, my) {
    for (let i = 0; i < cards.length; i++) {
      let c = cards[i];
      if (
        mx >= c.x && mx <= c.x + CARD_W &&
        my >= c.y && my <= c.y + CARD_H
      ) return i;
    }
    return -1;
  }
  function onCardClick(idx) {
    if (animating || paused || showOverlay) return;
    let card = cards[idx];
    if (card.flipped || card.matched) return;
    card.anim = 0;
    flipCards = [card];
    flipStart = performance.now();
    animating = true;
    flipped.push(idx);
  }
  function checkMatch() {
    // No-op: logic now handled in animate
  }
  // --- EVENTS ---
  function handlePointer(e) {
    let mx, my;
    const rect = canvas.getBoundingClientRect();
    if (e.type.startsWith('touch')) {
      // Use the first touch point
      mx = ((e.changedTouches[0].clientX - rect.left) / rect.width) * canvas.width;
      my = ((e.changedTouches[0].clientY - rect.top) / rect.height) * canvas.height;
    } else {
      mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      my = ((e.clientY - rect.top) / rect.height) * canvas.height;
    }
    if (showOverlay) {
      if (
        mx > canvas.width/2-60 && mx < canvas.width/2+60 &&
        my > canvas.height/2+10 && my < canvas.height/2+54
      ) {
        if (showOverlay) { // prevent double triggers
          showOverlay = false;
          reset();
          animate(performance.now());
        }
      }
      return;
    }
    let idx = -1;
    for (let i = 0; i < cards.length; i++) {
      let c = cards[i];
      if (
        mx >= c.x && mx <= c.x + CARD_W &&
        my >= c.y && my <= c.y + CARD_H
      ) {
        idx = i;
        break;
      }
    }
    if (idx !== -1) onCardClick(idx);
  }
  canvas.addEventListener("mousedown", handlePointer);
  // Touch: use pointer events for smoother mobile tap
  canvas.addEventListener("touchstart", function(e) {
    if (e.changedTouches && e.changedTouches.length === 1) {
      handlePointer(e);
      e.preventDefault();
    }
  }, { passive: false });

  // --- CONTROLS ---
  if (controlRef && typeof controlRef === "object") {
    controlRef.current = {
      restart: () => { reset(); animate(performance.now()); },
      pause: () => (paused = true),
      resume: () => (paused = false),
      isPaused: () => paused
    };
  }

  // --- START ---
  animate(performance.now());

  // --- CLEANUP ---
  return () => {
    running = false;
    canvas.removeEventListener("mousedown", handlePointer);
    canvas.removeEventListener("touchstart", handlePointer);
  };
}
