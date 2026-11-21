// Mouse and keyboard input for Firefly Hollow. Mouse clicks land where the pointer is;
// arrow keys walk a crosshair between the two pictures, Enter or Space clicks at it,
// Tab hops it to the other picture. H asks for a hint, P pauses, M mutes, R restarts.
import { PANEL_HEIGHT, PANEL_LEFT_X, PANEL_RIGHT_X, PANEL_WIDTH, PANEL_Y, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

export const ACTION_NONE = 0;
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

/** A point in the logical 1280 by 480 frame, or null when the pointer is outside it. */
export function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / VIEW_WIDTH, rect.height / VIEW_HEIGHT);
  const offsetX = (rect.width - VIEW_WIDTH * scale) / 2;
  const offsetY = (rect.height - VIEW_HEIGHT * scale) / 2;
  const x = (clientX - rect.left - offsetX) / scale;
  const y = (clientY - rect.top - offsetY) / scale;
  if (x < 0 || y < 0 || x > VIEW_WIDTH || y > VIEW_HEIGHT) return null;
  return { x, y };
}

/**
 * Which panel a logical point falls in, and its coordinates inside that panel —
 * null when the point is in the header, the footer or the gap between the pictures.
 */
export function panelAt(point) {
  if (point === null) return null;
  if (point.y < PANEL_Y || point.y > PANEL_Y + PANEL_HEIGHT) return null;
  if (point.x >= PANEL_LEFT_X && point.x <= PANEL_LEFT_X + PANEL_WIDTH) {
    return { panel: 0, x: point.x - PANEL_LEFT_X, y: point.y - PANEL_Y };
  }
  if (point.x >= PANEL_RIGHT_X && point.x <= PANEL_RIGHT_X + PANEL_WIDTH) {
    return { panel: 1, x: point.x - PANEL_RIGHT_X, y: point.y - PANEL_Y };
  }
  return null;
}

/** The header's hint button, in logical coordinates. */
export const HINT_BUTTON = { x: 1064, y: 14, width: 96, height: 32 };
/** The header's sound button, in logical coordinates. */
export const SOUND_BUTTON = { x: 1168, y: 14, width: 76, height: 32 };

export function insideButton(point, button) {
  return (
    point !== null &&
    point.x >= button.x &&
    point.x <= button.x + button.width &&
    point.y >= button.y &&
    point.y <= button.y + button.height
  );
}

export function createInput(canvas, world) {
  let actions = ACTION_NONE;
  const clicks = [];
  let keysHeld = new Set();

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(canvas, event.clientX, event.clientY);
    clicks.push(point);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') {
      actions |= ACTION_PAUSE;
    } else if (key === 'h') {
      actions |= ACTION_HINT;
    } else if (key === 'm') {
      actions |= ACTION_MUTE;
    } else if (key === 'r') {
      actions |= ACTION_RESTART;
    } else if (key === 'tab') {
      world.cursor.panel = 1 - world.cursor.panel;
      event.preventDefault();
    } else if (key.startsWith('arrow')) {
      keysHeld.add(key);
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keysHeld.delete(event.key.toLowerCase());
  });

  /** The crosshair's step each frame from the held arrow keys. */
  function cursorStep() {
    const step = 14;
    let dx = 0;
    let dy = 0;
    if (keysHeld.has('arrowleft')) dx -= step;
    if (keysHeld.has('arrowright')) dx += step;
    if (keysHeld.has('arrowup')) dy -= step;
    if (keysHeld.has('arrowdown')) dy += step;
    return { dx, dy };
  }

  return {
    takeActions() {
      const taken = actions;
      actions = ACTION_NONE;
      return taken;
    },
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    moveCursor() {
      const { dx, dy } = cursorStep();
      world.cursor.x = Math.min(PANEL_WIDTH, Math.max(0, world.cursor.x + dx));
      world.cursor.y = Math.min(PANEL_HEIGHT, Math.max(0, world.cursor.y + dy));
    },
  };
}
