import pygame
import random
from common_game import main_game_loop, WIDTH, HEIGHT

# ================= CONSTANTS =================
GRAVITY = 600
FLAP_STRENGTH = -240
PIPE_SPEED = -140
PIPE_GAP = 170
PIPE_INTERVAL = 1.8

BIRD_X = 80
BIRD_RADIUS = 16
PIPE_WIDTH = 60

# ================= GLOBAL STATE =================
bird_y = HEIGHT // 2
bird_vel = 0.0
pipes = []
pipe_timer = 0.0

game_paused = False
show_menu = True


# ================= HARD RESET =================
def hard_reset():
    global bird_y, bird_vel, pipes, pipe_timer, game_paused, show_menu
    bird_y = HEIGHT // 2
    bird_vel = 0.0
    pipes = []
    pipe_timer = 0.0
    game_paused = False
    show_menu = True


def init_state():
    hard_reset()


def reset_state():
    hard_reset()


# ================= PIPE =================
def spawn_pipe():
    gap_y = random.randint(120, HEIGHT - 120)
    pipes.append({
        "x": WIDTH + 40,
        "gap_y": gap_y
    })


# ================= UPDATE =================
def update_game(dt):
    global bird_y, bird_vel, pipe_timer, game_paused, show_menu

    # -------- EVENTS --------
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            exit()

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN and show_menu:
                show_menu = False

            elif event.key == pygame.K_p and not show_menu:
                game_paused = not game_paused
                bird_vel = 0.0

            elif event.key == pygame.K_r:
                hard_reset()
                show_menu = False

            elif event.key == pygame.K_m:
                hard_reset()

            elif event.key in (pygame.K_SPACE, pygame.K_UP):
                if not show_menu and not game_paused:
                    bird_vel = FLAP_STRENGTH

    # -------- STOP GAME LOGIC --------
    if show_menu or game_paused:
        return

    # -------- SAFE TIME STEP --------
    dt = min(dt, 0.016)  # 60 FPS cap (VERY IMPORTANT)

    # -------- PHYSICS (RUN ONCE ONLY) --------
    bird_vel += GRAVITY * dt
    bird_y += bird_vel * dt

    # Pipes
    pipe_timer += dt
    if pipe_timer >= PIPE_INTERVAL:
        pipe_timer = 0.0
        spawn_pipe()

    for p in pipes:
        p["x"] += PIPE_SPEED * dt

    pipes = [p for p in pipes if p["x"] > -PIPE_WIDTH]

    # -------- COLLISION --------
    if bird_y < BIRD_RADIUS or bird_y > HEIGHT - BIRD_RADIUS:
        hard_reset()
        return

    for p in pipes:
        if BIRD_X + BIRD_RADIUS > p["x"] and BIRD_X - BIRD_RADIUS < p["x"] + PIPE_WIDTH:
            if bird_y < p["gap_y"] - PIPE_GAP // 2 or bird_y > p["gap_y"] + PIPE_GAP // 2:
                hard_reset()
                return


# ================= DRAW =================
def draw_game(surface):
    surface.fill((14, 116, 144))
    font = pygame.font.SysFont(None, 32)

    # Bird
    pygame.draw.circle(
        surface,
        (234, 179, 8),
        (BIRD_X, int(bird_y)),
        BIRD_RADIUS
    )

    # Pipes
    for p in pipes:
        x = int(p["x"])
        gap_y = p["gap_y"]
        pygame.draw.rect(
            surface,
            (22, 163, 74),
            (x, 0, PIPE_WIDTH, gap_y - PIPE_GAP // 2)
        )
        pygame.draw.rect(
            surface,
            (22, 163, 74),
            (x, gap_y + PIPE_GAP // 2, PIPE_WIDTH, HEIGHT)
        )

    # -------- MENU --------
    if show_menu:
        text = font.render("PRESS ENTER TO PLAY", True, (255, 255, 255))
        surface.blit(
            text,
            (WIDTH // 2 - text.get_width() // 2,
             HEIGHT // 2)
        )
        return

    # -------- UI BUTTONS --------
    pause_btn = pygame.Rect(WIDTH // 2 - 150, HEIGHT - 60, 90, 40)
    restart_btn = pygame.Rect(WIDTH // 2 - 45, HEIGHT - 60, 90, 40)
    menu_btn = pygame.Rect(WIDTH // 2 + 60, HEIGHT - 60, 90, 40)

    pygame.draw.rect(surface, (59, 130, 246), pause_btn, border_radius=8)
    pygame.draw.rect(surface, (248, 113, 113), restart_btn, border_radius=8)
    pygame.draw.rect(surface, (30, 41, 59), menu_btn, border_radius=8)

    surface.blit(font.render("Pause", True, (255, 255, 255)),
                 (pause_btn.x + 10, pause_btn.y + 8))
    surface.blit(font.render("Restart", True, (255, 255, 255)),
                 (restart_btn.x + 8, restart_btn.y + 8))
    surface.blit(font.render("Menu", True, (255, 255, 255)),
                 (menu_btn.x + 18, menu_btn.y + 8))

    # -------- PAUSE OVERLAY --------
    if game_paused:
        overlay = pygame.Surface((WIDTH, HEIGHT))
        overlay.set_alpha(150)
        overlay.fill((0, 0, 0))
        surface.blit(overlay, (0, 0))
        pause_text = font.render("PAUSED - PRESS P", True, (255, 255, 255))
        surface.blit(
            pause_text,
            (WIDTH // 2 - pause_text.get_width() // 2,
             HEIGHT // 2)
        )


# ================= RUN =================
if __name__ == "__main__":
    main_game_loop(
        "Flappy Bird",
        update_game,
        draw_game,
        init_state,
        reset_state
    )
