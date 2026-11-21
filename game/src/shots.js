// The screenshot scenes behind ?shot=cover|play|hint|complete. Each one sets the real
// world to a mid-game state — found differences circled on both pictures, several still
// hiding, the counter showing how many are left — and paints it, so a screenshot is a
// frame of the game itself, not a mock-up. The same seed always gives the same frame.
import { SCREEN_LEVEL_DONE, SCREEN_PLAY, startLevel } from './world.js';

/**
 * Stage the named scene on `world` and return the screen to draw over it.
 * cover: scene 1, three of seven found, four left. play: scene 2, two found.
 * hint: scene 3, four found and a hint pulsing on one still hiding. complete: scene 1,
 * all seven found, the level-done banner up.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    startLevel(world, 1);
    world.level.found.add('awning');
    world.level.found.add('apple');
    world.level.timeLeft = 98;
    world.level.elapsed = 52;
    world.score = 200;
    world.level.message = 'Found it — an apple leaves the basket!';
    return SCREEN_PLAY;
  }
  if (name === 'hint') {
    startLevel(world, 2);
    world.level.found.add('frog');
    world.level.found.add('lilyflower');
    world.level.found.add('reed');
    world.level.found.add('stone');
    world.level.timeLeft = 121;
    world.level.elapsed = 59;
    world.score = 350;
    world.level.hintsLeft = 2; // one hint spent to circle the reflection
    world.level.hintAt = { id: 'reflection', until: 61.5 };
    world.level.message = 'A hint circles one difference still hiding…';
    return SCREEN_PLAY;
  }
  if (name === 'complete') {
    startLevel(world, 0);
    for (const difference of ['firefly', 'lantern', 'mushroom', 'star', 'cattail', 'flower', 'crater']) {
      world.level.found.add(difference);
    }
    world.level.timeLeft = 87;
    world.level.elapsed = 63;
    world.levelBonus = 174;
    world.score = 874;
    world.screen = SCREEN_LEVEL_DONE;
    return SCREEN_LEVEL_DONE;
  }
  startLevel(world, 0);
  world.level.found.add('firefly');
  world.level.found.add('lantern');
  world.level.found.add('mushroom');
  world.level.timeLeft = 104;
  world.level.elapsed = 46;
  world.score = 300;
  world.level.message = 'Found it — a mushroom vanishes!';
  return SCREEN_PLAY;
}
