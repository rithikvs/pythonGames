import pygame
import random
import math
from common_game import main_game_loop, WIDTH, HEIGHT

# ---------------- CONSTANTS ----------------
BUBBLE_RADIUS = 18
BUBBLE_COLORS = [
    (255, 99, 132), (54, 162, 235), (255, 206, 86),
    (75, 192, 192), (153, 102, 255), (255, 159, 64)
]
SHOOTER_Y = HEIGHT - 40
SHOOTER_RADIUS = 22
BUBBLE_SPEED = 420
ADD_BUBBLE_INTERVAL = 10.0  # seconds

# ---------------- GLOBAL STATE ----------------
bubbles = []  # Each bubble: {x, y, color}
shooter_color = random.choice(BUBBLE_COLORS)
shooter_x = WIDTH // 2
shooting = False
shot_bubble = None
last_bubble_time = 0
score = 0
game_over = False
show_menu = True

# ---------------- INIT / RESET ----------------
def init_state():
    global bubbles, shooter_color, shooter_x, shooting, shot_bubble, last_bubble_time, score, game_over, show_menu
    bubbles = []
    shooter_color = random.choice(BUBBLE_COLORS)
    shooter_x = WIDTH // 2
    shooting = False
    shot_bubble = None
    last_bubble_time = pygame.time.get_ticks() / 1000.0
    score = 0
    game_over = False
    show_menu = True

def reset_state():
    init_state()

# ---------------- UPDATE ----------------
def update_game(dt):
    global shooter_x, shooting, shot_bubble, bubbles, shooter_color, last_bubble_time, score, game_over, show_menu
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            exit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN and show_menu:
                show_menu = False
            elif event.key == pygame.K_r:
                reset_state()
                show_menu = False
        if event.type == pygame.MOUSEMOTION:
            mx, _ = event.pos
            shooter_x = max(SHOOTER_RADIUS, min(WIDTH - SHOOTER_RADIUS, mx))
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1 and not shooting and not show_menu:
            shooting = True
            shot_bubble = {
                'x': shooter_x,
                'y': SHOOTER_Y,
                'color': shooter_color,
                'vy': -BUBBLE_SPEED
            }
            shooter_color = random.choice(BUBBLE_COLORS)

    if show_menu:
        return

    # Add new bubbles every 10 seconds
    now = pygame.time.get_ticks() / 1000.0
    if now - last_bubble_time > ADD_BUBBLE_INTERVAL:
        for _ in range(random.randint(2, 4)):
            bubbles.append({
                'x': random.randint(BUBBLE_RADIUS, WIDTH - BUBBLE_RADIUS),
                'y': random.randint(60, HEIGHT // 2),
                'color': random.choice(BUBBLE_COLORS)
            })
        last_bubble_time = now

    # Move shot bubble
    if shooting and shot_bubble:
        shot_bubble['y'] += shot_bubble['vy'] * dt
        # Check collision with bubbles
        to_remove = []
        for i, b in enumerate(bubbles):
            dist = math.hypot(shot_bubble['x'] - b['x'], shot_bubble['y'] - b['y'])
            if dist < BUBBLE_RADIUS * 2:
                if shot_bubble['color'] == b['color']:
                    # Remove all connected bubbles of this color
                    remove_connected_bubbles(i, b['color'])
                    score += 10
                else:
                    # Add the shot bubble to the field
                    bubbles.append({
                        'x': shot_bubble['x'],
                        'y': shot_bubble['y'],
                        'color': shot_bubble['color']
                    })
                shooting = False
                shot_bubble = None
                break
        # If bubble goes off screen
        if shot_bubble and shot_bubble['y'] < 0:
            bubbles.append({
                'x': shot_bubble['x'],
                'y': BUBBLE_RADIUS,
                'color': shot_bubble['color']
            })
            shooting = False
            shot_bubble = None

# Helper to remove all connected bubbles of the same color
from collections import deque
def remove_connected_bubbles(start_idx, color):
    global bubbles
    to_check = deque([start_idx])
    to_remove = set()
    while to_check:
        idx = to_check.popleft()
        if idx in to_remove:
            continue
        to_remove.add(idx)
        bx, by = bubbles[idx]['x'], bubbles[idx]['y']
        for j, b in enumerate(bubbles):
            if j not in to_remove and b['color'] == color:
                if math.hypot(bx - b['x'], by - b['y']) < BUBBLE_RADIUS * 2 + 2:
                    to_check.append(j)
    bubbles = [b for i, b in enumerate(bubbles) if i not in to_remove]

# ---------------- DRAW ----------------
def draw_game(surface):
    surface.fill((30, 41, 59))
    font = pygame.font.SysFont(None, 48)
    small_font = pygame.font.SysFont(None, 32)
    # Draw bubbles
    for b in bubbles:
        pygame.draw.circle(surface, b['color'], (int(b['x']), int(b['y'])), BUBBLE_RADIUS)
    # Draw shot bubble
    if shooting and shot_bubble:
        pygame.draw.circle(surface, shot_bubble['color'], (int(shot_bubble['x']), int(shot_bubble['y'])), BUBBLE_RADIUS)
    # Draw shooter
    pygame.draw.circle(surface, shooter_color, (int(shooter_x), SHOOTER_Y), SHOOTER_RADIUS, 4)
    # Draw score
    score_text = small_font.render(f"Score: {score}", True, (255,255,255))
    surface.blit(score_text, (10, 10))
    # Menu
    if show_menu:
        surface.fill((30, 41, 59))
        title = font.render("Bubble Shooter", True, (248, 250, 252))
        surface.blit(title, (WIDTH // 2 - title.get_width() // 2, 80))
        surface.blit(
            small_font.render("ENTER - Start", True, (59, 130, 246)),
            (WIDTH // 2 - 90, 180)
        )
        surface.blit(
            small_font.render("Click to Shoot Bubble", True, (248, 113, 113)),
            (WIDTH // 2 - 150, 220)
        )
        surface.blit(
            small_font.render("R - Restart", True, (255, 255, 255)),
            (WIDTH // 2 - 70, 260)
        )

# ---------------- RUN ----------------
if __name__ == "__main__":
    main_game_loop(
        "Bubble Shooter",
        update_game,
        draw_game,
        init_state,
        reset_state
    )
