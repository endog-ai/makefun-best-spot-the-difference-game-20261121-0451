// Boot and the one loop: clicks and keys are read every frame, the clock advances in
// fixed steps, and the renderer paints what is there. The game moves between six
// screens: title, play, paused, level-done, time-up and win.
//
// ?shot=cover|play|hint|complete stages that scene instead of running the loop, paints
// it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import {
  ACTION_CONFIRM,
  ACTION_HINT,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  HINT_BUTTON,
  SOUND_BUTTON,
  createInput,
  insideButton,
  panelAt,
  toLogical,
} from './input.js';
import { createSound } from './sound.js';
import {
  EVENT_FOUND,
  EVENT_LEVEL_DONE,
  EVENT_MISS,
  EVENT_TIME_UP,
  SCREEN_LEVEL_DONE,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TIME_UP,
  SCREEN_TITLE,
  SCREEN_WIN,
  advanceLevel,
  clickAt,
  createWorld,
  restartGame,
  startLevel,
  tick,
  useHint,
} from './world.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
/** The scene's animation clock in a screenshot, so the frame never depends on luck. */
const SHOT_TIME = 1.2;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const screen = stageShot(name, world);
  // The staged frame is drawn from `screen`; keep the world's own screen on the title
  // so the keyboard crosshair stays out of the screenshot.
  world.screen = SCREEN_TITLE;
  let painted = 0;
  function paint() {
    renderer.draw(world, screen, readBest(), SHOT_TIME, sound.muted);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      document.title = 'Firefly Hollow — shot ready';
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, world);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let startedAt = last;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    sound.unlock();
    restartGame(world);
    screen = SCREEN_PLAY;
    announce('Playing. Find 7 differences in each scene.');
  }

  function endGame() {
    screen = SCREEN_WIN;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    announce(`You found them all. Final score ${world.score}.`);
  }

  function handleClicks() {
    for (const point of input.takeClicks()) {
      if (point === null) continue;
      if (insideButton(point, SOUND_BUTTON)) {
        sound.toggleMuted();
        continue;
      }
      if (screen === SCREEN_PLAY && insideButton(point, HINT_BUTTON)) {
        if (useHint(world, world.level.elapsed) !== null) sound.hint();
        continue;
      }
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN) {
        startGame();
        continue;
      }
      if (screen === SCREEN_LEVEL_DONE) {
        if (!advanceLevel(world)) endGame();
        else screen = SCREEN_PLAY;
        continue;
      }
      if (screen === SCREEN_TIME_UP) {
        startLevel(world, world.level.levelIndex);
        screen = SCREEN_PLAY;
        continue;
      }
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        continue;
      }
      const panel = panelAt(point);
      if (panel !== null && screen === SCREEN_PLAY) {
        sound.unlock();
        world.cursor.panel = panel.panel;
        world.cursor.x = panel.x;
        world.cursor.y = panel.y;
        const events = clickAt(world, panel.x, panel.y);
        if (events & EVENT_FOUND) sound.found();
        if (events & EVENT_MISS) sound.miss();
        if (events & EVENT_LEVEL_DONE) {
          screen = SCREEN_LEVEL_DONE;
          sound.levelDone();
          announce(`Level complete. Bonus ${world.levelBonus}.`);
        }
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) sound.toggleMuted();
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN) {
        startGame();
        return;
      }
      if (screen === SCREEN_LEVEL_DONE) {
        if (!advanceLevel(world)) endGame();
        else screen = SCREEN_PLAY;
        return;
      }
      if (screen === SCREEN_TIME_UP) {
        startLevel(world, world.level.levelIndex);
        screen = SCREEN_PLAY;
        return;
      }
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        return;
      }
      if (screen === SCREEN_PLAY) {
        sound.unlock();
        const events = clickAt(world, world.cursor.x, world.cursor.y);
        if (events & EVENT_FOUND) sound.found();
        if (events & EVENT_MISS) sound.miss();
        if (events & EVENT_LEVEL_DONE) {
          screen = SCREEN_LEVEL_DONE;
          sound.levelDone();
        }
        return;
      }
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      if (useHint(world, world.level.elapsed) !== null) sound.hint();
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    world.totalTime = (now - startedAt) / 1000;
    handleClicks();
    handleActions();
    input.moveCursor();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        if (tick(world, STEP) & EVENT_TIME_UP) {
          screen = SCREEN_TIME_UP;
          sound.timeUp();
          announce("Time's up.");
        }
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    world.screen = screen;
    renderer.draw(world, screen, best, world.totalTime, sound.muted);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Firefly Hollow. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
