import pygame
import sys

WIDTH, HEIGHT = 640, 480
FPS = 60

STATE_MENU = "menu"
STATE_PLAYING = "playing"
STATE_PAUSED = "paused"

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (50, 50, 50)
OVERLAY_BG = (0, 0, 0, 180)


class Button:
    def __init__(self, rect, text, font, bg=(30, 64, 175), fg=WHITE):
        self.rect = pygame.Rect(rect)
        self.text = text
        self.font = font
        self.bg = bg
        self.fg = fg

    def draw(self, surface):
        pygame.draw.rect(surface, self.bg, self.rect, border_radius=8)
        label = self.font.render(self.text, True, self.fg)
        label_rect = label.get_rect(center=self.rect.center)
        surface.blit(label, label_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                return True
        return False


def create_window():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Pygame Game")
    return screen


def draw_centered_text(surface, text, font, color, y):
    label = font.render(text, True, color)
    rect = label.get_rect(center=(WIDTH // 2, y))
    surface.blit(label, rect)


def handle_common_events(event, state):
    if event.type == pygame.QUIT:
        pygame.quit()
        sys.exit()
    if state == STATE_PLAYING and event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
        return STATE_PAUSED
    return state


def draw_pause_overlay(surface, font, resume_button, restart_button, menu_button):
    overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    overlay.fill(OVERLAY_BG)
    surface.blit(overlay, (0, 0))

    # Resume button exactly at center
    resume_button.rect.center = (WIDTH // 2, HEIGHT // 2)
    restart_button.rect.center = (WIDTH // 2, HEIGHT // 2 + 60)
    menu_button.rect.center = (WIDTH // 2, HEIGHT // 2 + 120)

    resume_button.draw(surface)
    restart_button.draw(surface)
    menu_button.draw(surface)

    title = font.render("Paused", True, WHITE)
    surface.blit(title, title.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 80)))


def main_game_loop(game_title, update_fn, draw_fn, init_fn, reset_fn):
    screen = create_window()
    clock = pygame.time.Clock()
    font_large = pygame.font.SysFont(None, 48)
    font_small = pygame.font.SysFont(None, 32)

    pygame.display.set_caption(game_title)

    state = STATE_MENU
    running = True

    # Initial game state via init_fn
    init_fn()

    # Buttons
    play_button = Button((0, 0, 180, 50), "Play", font_small)
    play_button.rect.center = (WIDTH // 2, HEIGHT // 2)

    resume_button = Button((0, 0, 200, 50), "Resume", font_small)
    restart_button = Button((0, 0, 200, 50), "Restart", font_small)
    menu_button = Button((0, 0, 200, 50), "Main Menu", font_small)

    while running:
        dt = clock.tick(FPS) / 1000.0

        for event in pygame.event.get():
            state = handle_common_events(event, state)

            if state == STATE_MENU:
                if play_button.handle_event(event):
                    reset_fn()
                    state = STATE_PLAYING
            elif state == STATE_PLAYING:
                # game-specific input handled in update_fn if needed
                pass
            elif state == STATE_PAUSED:
                if resume_button.handle_event(event):
                    state = STATE_PLAYING
                elif restart_button.handle_event(event):
                    reset_fn()
                    state = STATE_PLAYING
                elif menu_button.handle_event(event):
                    pygame.quit()
                    sys.exit()

        screen.fill(BLACK)

        if state == STATE_MENU:
            draw_centered_text(screen, game_title, font_large, WHITE, HEIGHT // 2 - 80)
            draw_centered_text(screen, "Click Play to start", font_small, WHITE, HEIGHT // 2 - 30)
            play_button.draw(screen)
        elif state == STATE_PLAYING:
            update_fn(dt)
            draw_fn(screen)
        elif state == STATE_PAUSED:
            # Draw last frame of game
            draw_fn(screen)
            draw_pause_overlay(screen, font_small, resume_button, restart_button, menu_button)

        pygame.display.flip()
