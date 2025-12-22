import pygame
import random
from common_game import main_game_loop, WIDTH, HEIGHT, WHITE, BLACK

GROUND_Y = HEIGHT - 60
PLAYER_WIDTH = 30
PLAYER_HEIGHT = 40
OBSTACLE_WIDTH = 30
OBSTACLE_HEIGHT = 50
SPEED = 260
SPAWN_INTERVAL = 1.4

player_y = GROUND_Y - PLAYER_HEIGHT
player_vy = 0
GRAVITY = 900
JUMP_VELOCITY = -450

obstacles = []
spawn_timer = 0.0


def init_state():
    global player_y, player_vy, obstacles, spawn_timer
    player_y = GROUND_Y - PLAYER_HEIGHT
    player_vy = 0
    obstacles = []
    spawn_timer = 0.0

game_paused = False
show_menu = True

def reset_state():
    init_state()


def spawn_obstacle():
    global obstacles
    x = WIDTH + 40
    h = OBSTACLE_HEIGHT
    rect = pygame.Rect(x, GROUND_Y - h, OBSTACLE_WIDTH, h)
    obstacles.append(rect)


def update_game(dt):
    global player_y, player_vy, obstacles, spawn_timer
    keys = pygame.key.get_pressed()
    if (keys[pygame.K_SPACE] or keys[pygame.K_UP]) and player_y >= GROUND_Y - PLAYER_HEIGHT - 1:
        player_vy = JUMP_VELOCITY

    player_vy += GRAVITY * dt
    player_y += player_vy * dt

    if player_y > GROUND_Y - PLAYER_HEIGHT:
        player_y = GROUND_Y - PLAYER_HEIGHT
        player_vy = 0

    spawn_timer += dt
    if spawn_timer >= SPAWN_INTERVAL:
        spawn_timer = 0.0
        spawn_obstacle()

    for o in obstacles:
        o.x -= int(SPEED * dt)
    obstacles[:] = [o for o in obstacles if o.right > -20]

    player_rect = pygame.Rect(80, int(player_y), PLAYER_WIDTH, PLAYER_HEIGHT)
    for o in obstacles:
        if player_rect.colliderect(o):
            reset_state()
            break

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
        if (keys[pygame.K_SPACE] or keys[pygame.K_UP]) and player_y >= GROUND_Y - PLAYER_HEIGHT - 1:
            player_vy = JUMP_VELOCITY

        player_vy += GRAVITY * dt
        player_y += player_vy * dt

        if player_y > GROUND_Y - PLAYER_HEIGHT:
            player_y = GROUND_Y - PLAYER_HEIGHT
            player_vy = 0

        spawn_timer += dt
        if spawn_timer >= SPAWN_INTERVAL:
            spawn_timer = 0.0
            spawn_obstacle()

        for o in obstacles:
            o.x -= int(SPEED * dt)
        obstacles[:] = [o for o in obstacles if o.right > -20]

        player_rect = pygame.Rect(80, int(player_y), PLAYER_WIDTH, PLAYER_HEIGHT)
        for o in obstacles:
            if player_rect.colliderect(o):
                reset_state()
                break


def draw_game(surface):
    surface.fill((15, 23, 42))
    # ground
    pygame.draw.rect(surface, (55, 65, 81), pygame.Rect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y))

    # player
    player_rect = pygame.Rect(80, int(player_y), PLAYER_WIDTH, PLAYER_HEIGHT)
    pygame.draw.rect(surface, (56, 189, 248), player_rect)

    # obstacles
    for o in obstacles:
        pygame.draw.rect(surface, (248, 113, 113), o)
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
    main_game_loop("Endless Runner", update_game, draw_game, init_state, reset_state)
