import pygame
import random
from common_game import main_game_loop, WIDTH, HEIGHT, WHITE, BLACK

# Game state variables
cell_size = 20
cols = WIDTH // cell_size
rows = HEIGHT // cell_size

snake = []
direction = (1, 0)
food = None


def init_state():
    global snake, direction, food
    snake = [(cols // 2, rows // 2)]
    direction = (1, 0)
    spawn_food()

game_paused = False
show_menu = True

def reset_state():
    init_state()


def spawn_food():
    global food
    while True:
        pos = (random.randint(0, cols - 1), random.randint(0, rows - 1))
        if pos not in snake:
            food = pos
            break


def update_game(dt):
    global snake, direction, food
    keys = pygame.key.get_pressed()
    if keys[pygame.K_UP] and direction != (0, 1):
        direction = (0, -1)
    elif keys[pygame.K_DOWN] and direction != (0, -1):
        direction = (0, 1)
    elif keys[pygame.K_LEFT] and direction != (1, 0):
        direction = (-1, 0)
    elif keys[pygame.K_RIGHT] and direction != (-1, 0):
        direction = (1, 0)

    # Move snake at fixed speed independent of FPS
    move_snake(interval=0.12, dt=dt)
    global game_paused, show_menu
    pause_btn = pygame.Rect(WIDTH//2-150, HEIGHT-60, 90, 40)
    restart_btn = pygame.Rect(WIDTH//2-45, HEIGHT-60, 90, 40)
    menu_btn = pygame.Rect(WIDTH//2+60, HEIGHT-60, 90, 40)

    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_p:
                game_paused = not game_paused
            if event.key == pygame.K_r:
                reset_state()
                show_menu = False
                game_paused = False
            if event.key == pygame.K_m:
                show_menu = True
                game_paused = False
            if event.key == pygame.K_RETURN and show_menu:
                show_menu = False
                game_paused = False
        if event.type == pygame.MOUSEBUTTONDOWN:
            mx, my = event.pos
            if pause_btn.collidepoint(mx, my) and not show_menu:
                game_paused = not game_paused
            if restart_btn.collidepoint(mx, my) and not show_menu:
                reset_state()
                show_menu = False
                game_paused = False
            if menu_btn.collidepoint(mx, my):
                show_menu = True
                game_paused = False

    if not (show_menu or game_paused):
        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP] and direction != (0, 1):
            direction = (0, -1)
        elif keys[pygame.K_DOWN] and direction != (0, -1):
            direction = (0, 1)
        elif keys[pygame.K_LEFT] and direction != (1, 0):
            direction = (-1, 0)
        elif keys[pygame.K_RIGHT] and direction != (-1, 0):
            direction = (1, 0)
        move_snake(interval=0.12, dt=dt)


_move_accum = 0.0


def move_snake(interval, dt):
    global _move_accum, snake, direction, food
    _move_accum += dt
    if _move_accum < interval:
        return
    _move_accum = 0.0

    if not snake:
        return
    head_x, head_y = snake[0]
    dx, dy = direction
    new_head = ((head_x + dx) % cols, (head_y + dy) % rows)

    if new_head in snake:
        # collision with self => reset
        reset_state()
        return

    snake.insert(0, new_head)

    if new_head == food:
        spawn_food()
    else:
        snake.pop()



def draw_game(surface):
    surface.fill(BLACK)
    # Draw food
    if food is not None:
        fx, fy = food
        pygame.draw.rect(
            surface,
            (220, 38, 38),
            pygame.Rect(fx * cell_size, fy * cell_size, cell_size, cell_size),
        )
    # Draw snake
    for i, (x, y) in enumerate(snake):
        color = (34, 197, 94) if i == 0 else (22, 163, 74)
        pygame.draw.rect(
            surface,
            color,
            pygame.Rect(x * cell_size, y * cell_size, cell_size, cell_size),
        )
    font = pygame.font.SysFont(None, 32)
    pause_btn = pygame.Rect(WIDTH//2-150, HEIGHT-60, 90, 40)
    restart_btn = pygame.Rect(WIDTH//2-45, HEIGHT-60, 90, 40)
    menu_btn = pygame.Rect(WIDTH//2+60, HEIGHT-60, 90, 40)
    if not globals().get('show_menu', False):
        pygame.draw.rect(surface, (59, 130, 246), pause_btn, border_radius=8)
        pygame.draw.rect(surface, (248, 113, 113), restart_btn, border_radius=8)
        pygame.draw.rect(surface, (30, 41, 59), menu_btn, border_radius=8)
        surface.blit(font.render("Pause", True, (255,255,255)), (pause_btn.x+10, pause_btn.y+8))
        surface.blit(font.render("Restart", True, (255,255,255)), (restart_btn.x+8, restart_btn.y+8))
        surface.blit(font.render("Menu", True, (255,255,255)), (menu_btn.x+18, menu_btn.y+8))


if __name__ == "__main__":
    main_game_loop("Snake", update_game, draw_game, init_state, reset_state)
