import pygame
from common_game import main_game_loop, WIDTH, HEIGHT

# ---------------- CONSTANTS ----------------
PADDLE_WIDTH = 100
PADDLE_HEIGHT = 14
BALL_RADIUS = 8

BRICK_ROWS = 5
BRICK_COLS = 10
BRICK_WIDTH = WIDTH // BRICK_COLS
BRICK_HEIGHT = 22


BALL_SPEED_INITIAL = 260
BALL_SPEED_INCREMENT = 20
BALL_SPEED = BALL_SPEED_INITIAL

# ---------------- GLOBAL STATE ----------------

paddle_x = WIDTH // 2
ball_x = WIDTH // 2
ball_y = HEIGHT // 2
ball_vx = BALL_SPEED_INITIAL
ball_vy = -BALL_SPEED_INITIAL
ball_speed = BALL_SPEED_INITIAL
bricks = []

game_paused = False
show_menu = True
game_over = False

# Mouse drag state
dragging = False
drag_offset_x = 0


# ---------------- INIT / RESET ----------------
def init_state():

    global paddle_x, ball_x, ball_y, ball_vx, ball_vy, ball_speed
    global bricks, game_paused, show_menu, game_over
    global dragging, drag_offset_x

    paddle_x = WIDTH // 2
    ball_x = WIDTH // 2
    ball_y = HEIGHT // 2
    ball_speed = BALL_SPEED_INITIAL
    ball_vx = ball_speed
    ball_vy = -ball_speed

    bricks = []
    for row in range(BRICK_ROWS):
        for col in range(BRICK_COLS):
            bricks.append(
                pygame.Rect(
                    col * BRICK_WIDTH,
                    row * BRICK_HEIGHT + 50,
                    BRICK_WIDTH - 3,
                    BRICK_HEIGHT - 3
                )
            )

    game_paused = False
    show_menu = True
    game_over = False
    dragging = False
    drag_offset_x = 0


def reset_state():
    global paddle_x, ball_x, ball_y, ball_vx, ball_vy, ball_speed
    global bricks, game_paused, show_menu, game_over
    global dragging, drag_offset_x

    paddle_x = WIDTH // 2
    ball_x = WIDTH // 2
    ball_y = HEIGHT // 2
    ball_speed = BALL_SPEED_INITIAL
    ball_vx = ball_speed
    ball_vy = -ball_speed

    bricks = []
    for row in range(BRICK_ROWS):
        for col in range(BRICK_COLS):
            bricks.append(
                pygame.Rect(
                    col * BRICK_WIDTH,
                    row * BRICK_HEIGHT + 50,
                    BRICK_WIDTH - 3,
                    BRICK_HEIGHT - 3
                )
            )

    game_paused = False
    show_menu = True
    game_over = False
    dragging = False
    drag_offset_x = 0


# ---------------- UPDATE ----------------
def update_game(dt):
    global paddle_x, ball_x, ball_y, ball_vx, ball_vy, ball_speed
    global game_paused, show_menu, game_over
    global dragging, drag_offset_x

    # ---------- EVENTS ----------
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            exit()

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN and show_menu:
                show_menu = False

            elif event.key == pygame.K_p and not show_menu:
                game_paused = not game_paused

            elif event.key == pygame.K_r:
                reset_state()
                show_menu = False

            elif event.key == pygame.K_m:
                init_state()

        # ---- LEFT CLICK DRAG CONTROL ----
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if not show_menu and not game_paused:
                mx, my = event.pos
                paddle_rect = pygame.Rect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT)
                paddle_rect.centerx = paddle_x
                paddle_rect.bottom = HEIGHT - 20

                if paddle_rect.collidepoint(mx, my):
                    dragging = True
                    drag_offset_x = paddle_x - mx

        if event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            dragging = False

        if event.type == pygame.MOUSEMOTION and dragging:
            mx, _ = event.pos
            paddle_x = mx + drag_offset_x

    # ---------- STOP GAME LOGIC ----------
    if show_menu or game_paused:
        return

    # ---------- CLAMP PADDLE ----------
    paddle_x = max(
        PADDLE_WIDTH // 2,
        min(WIDTH - PADDLE_WIDTH // 2, paddle_x)
    )

    # ---------- BALL MOVEMENT ----------
    dt = min(dt, 0.016)  # stable 60 FPS
    ball_x += ball_vx * dt
    ball_y += ball_vy * dt

    # ---------- WALL COLLISION ----------
    if ball_x - BALL_RADIUS < 0 or ball_x + BALL_RADIUS > WIDTH:
        ball_vx *= -1

    if ball_y - BALL_RADIUS < 0:
        ball_vy *= -1

    # ---------- PADDLE COLLISION ----------
    paddle_rect = pygame.Rect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT)
    paddle_rect.centerx = paddle_x
    paddle_rect.bottom = HEIGHT - 20

    ball_rect = pygame.Rect(0, 0, BALL_RADIUS * 2, BALL_RADIUS * 2)
    ball_rect.center = (ball_x, ball_y)

    if ball_vy > 0:
        if ball_rect.colliderect(paddle_rect):
            # Increase speed after every paddle bounce
            ball_speed += BALL_SPEED_INCREMENT
            # Calculate new velocity with increased speed
            ball_vy = -abs(ball_speed)
            offset = (ball_x - paddle_rect.centerx) / (PADDLE_WIDTH / 2)
            ball_vx = ball_speed * offset
        elif ball_y + BALL_RADIUS >= paddle_rect.bottom:
            # Ball missed the paddle, game over
            game_over = True
            show_menu = True
            return

    # ---------- BRICK COLLISION ----------
    hit = ball_rect.collidelist(bricks)
    if hit != -1:
        bricks.pop(hit)
        # Increase speed after every brick bounce
        ball_speed += BALL_SPEED_INCREMENT
        ball_vy *= -1
        # Adjust vx/vy to keep the same direction but with new speed
        norm = (ball_vx ** 2 + ball_vy ** 2) ** 0.5
        if norm != 0:
            ball_vx = ball_vx / norm * ball_speed
            ball_vy = ball_vy / abs(ball_vy) * ball_speed

    # ---------- GAME OVER ----------
    if ball_y - BALL_RADIUS > HEIGHT:
        game_over = True
        show_menu = True


# ---------------- DRAW ----------------
def draw_game(surface):
    surface.fill((15, 23, 42))
    font = pygame.font.SysFont(None, 48)
    small_font = pygame.font.SysFont(None, 32)

    # Paddle
    paddle_rect = pygame.Rect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT)
    paddle_rect.centerx = paddle_x
    paddle_rect.bottom = HEIGHT - 20
    pygame.draw.rect(surface, (59, 130, 246), paddle_rect)

    # Ball
    pygame.draw.circle(surface, (248, 250, 252),
                       (int(ball_x), int(ball_y)), BALL_RADIUS)

    # Bricks
    for b in bricks:
        pygame.draw.rect(surface, (248, 113, 113), b)

    # ---------- MENU ----------
    if show_menu:
        surface.fill((30, 41, 59))
        title = font.render("Brick Breaker", True, (248, 250, 252))
        surface.blit(title, (WIDTH // 2 - title.get_width() // 2, 80))
        surface.blit(
            small_font.render("ENTER - Start", True, (59, 130, 246)),
            (WIDTH // 2 - 90, 180)
        )
        surface.blit(
            small_font.render("Left Click + Drag Paddle", True, (248, 113, 113)),
            (WIDTH // 2 - 150, 220)
        )
        if game_over:
            surface.blit(
                font.render("Game Over!", True, (248, 113, 113)),
                (WIDTH // 2 - 120, 280)
            )


# ---------------- RUN ----------------
if __name__ == "__main__":
    main_game_loop(
        "Brick Breaker",
        update_game,
        draw_game,
        init_state,
        reset_state
    )
