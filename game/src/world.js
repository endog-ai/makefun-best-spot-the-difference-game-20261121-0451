// Firefly Hollow's state: which level is on, which differences are found, the clock,
// the score and the messages. It knows nothing about drawing or input — the renderer
// paints this, and main.js feeds it clicks and keys.
import {
  FIND_RADIUS,
  HINTS_PER_LEVEL,
  LEVELS,
  POINTS_PER_FIND,
  POINTS_PER_HINT,
  POINTS_PER_MISS,
} from './config.js';
import { LEVEL_SCENES } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL_DONE = 'level-done';
export const SCREEN_TIME_UP = 'time-up';
export const SCREEN_WIN = 'win';
export const SCREEN_PAUSED = 'paused';

export const EVENT_NONE = 0;
export const EVENT_FOUND = 1;
export const EVENT_MISS = 2;
export const EVENT_LEVEL_DONE = 4;
export const EVENT_TIME_UP = 8;

/** A fresh state for a level, with nothing found yet. */
export function createLevelState(levelIndex) {
  return {
    levelIndex,
    found: new Set(),
    timeLeft: LEVELS[levelIndex].timeLimit,
    hintsLeft: HINTS_PER_LEVEL,
    hintAt: null, // { id, until } while a hint ring is pulsing
    misses: [], // { x, y, at } wrong clicks, in panel coordinates of either panel
    message: 'Find 7 differences — click either picture.',
    messageAt: 0,
    elapsed: 0,
  };
}

export function createWorld() {
  return {
    screen: SCREEN_TITLE,
    level: createLevelState(0),
    score: 0,
    best: 0,
    levelBonus: 0,
    totalTime: 0,
    cursor: { panel: 0, x: 280, y: 170 }, // keyboard crosshair, panel coordinates
  };
}

export function differencesOf(levelIndex) {
  return LEVEL_SCENES[levelIndex].differences;
}

export function remainingCount(level) {
  return differencesOf(level.levelIndex).length - level.found.size;
}

/** The nearest unfound difference to a panel point, within FIND_RADIUS, or null. */
export function differenceAt(level, x, y) {
  let nearest = null;
  let nearestDistance = FIND_RADIUS;
  for (const difference of differencesOf(level.levelIndex)) {
    if (level.found.has(difference.id)) continue;
    const distance = Math.hypot(difference.x - x, difference.y - y);
    if (distance <= nearestDistance) {
      nearest = difference;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function setMessage(level, text) {
  level.message = text;
  level.messageAt = level.elapsed;
}

/**
 * A click at panel coordinates (x, y) on either picture. Returns an event bitmask:
 * EVENT_FOUND when a difference is circled, EVENT_MISS when the click lands on nothing,
 * EVENT_LEVEL_DONE when that find was the last one of the level.
 */
export function clickAt(world, x, y) {
  const level = world.level;
  const difference = differenceAt(level, x, y);
  if (difference === null) {
    world.score = Math.max(0, world.score - POINTS_PER_MISS);
    level.misses.push({ x, y, at: level.elapsed });
    setMessage(level, 'Not quite — look closer, that spot matches.');
    return EVENT_MISS;
  }
  level.found.add(difference.id);
  world.score += POINTS_PER_FIND;
  setMessage(level, `Found it — ${difference.label}!`);
  if (level.found.size === differencesOf(level.levelIndex).length) {
    const bonus = Math.round(level.timeLeft) * 2;
    world.levelBonus = bonus;
    world.score += bonus;
    world.screen = SCREEN_LEVEL_DONE;
    return EVENT_FOUND | EVENT_LEVEL_DONE;
  }
  return EVENT_FOUND;
}

/** Spend a hint: the next unfound difference pulses gold for a few seconds. */
export function useHint(world, now) {
  const level = world.level;
  if (level.hintsLeft <= 0 || world.screen !== SCREEN_PLAY) return null;
  const unfound = differencesOf(level.levelIndex).find((difference) => !level.found.has(difference.id));
  if (unfound === undefined) return null;
  level.hintsLeft -= 1;
  world.score = Math.max(0, world.score - POINTS_PER_HINT);
  level.hintAt = { id: unfound.id, until: now + 2.5 };
  setMessage(level, 'A hint circles one difference still hiding…');
  return unfound;
}

/** Advance the clock; returns EVENT_TIME_UP when the level's time runs out. */
export function tick(world, seconds) {
  const level = world.level;
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  level.elapsed += seconds;
  level.timeLeft = Math.max(0, level.timeLeft - seconds);
  level.misses = level.misses.filter((miss) => level.elapsed - miss.at < 0.9);
  if (level.hintAt !== null && level.elapsed >= level.hintAt.until) level.hintAt = null;
  if (level.timeLeft <= 0) {
    world.screen = SCREEN_TIME_UP;
    return EVENT_TIME_UP;
  }
  return EVENT_NONE;
}

export function startLevel(world, levelIndex) {
  world.level = createLevelState(levelIndex);
  world.screen = SCREEN_PLAY;
}

export function advanceLevel(world) {
  if (world.level.levelIndex + 1 >= LEVELS.length) {
    world.screen = SCREEN_WIN;
    return false;
  }
  startLevel(world, world.level.levelIndex + 1);
  return true;
}

export function restartGame(world) {
  world.score = 0;
  world.levelBonus = 0;
  startLevel(world, 0);
}
