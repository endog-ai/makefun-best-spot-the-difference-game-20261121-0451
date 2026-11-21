// Firefly Hollow's painter: one canvas, one logical frame of 1280 by 480, scaled to
// fit the window with letterboxing. It draws the header (title, level, timer, the
// counter of differences left, score, hint and sound buttons), the two pictures side
// by side with their found markers, the hint ring and the miss crosses, the footer
// message, and the title, pause, level-done, time-up and win overlays.
import {
  FOOTER_HEIGHT,
  FOOTER_Y,
  HEADER_HEIGHT,
  LEVELS,
  PANEL_HEIGHT,
  PANEL_LEFT_X,
  PANEL_RIGHT_X,
  PANEL_WIDTH,
  PANEL_Y,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { HINT_BUTTON, SOUND_BUTTON } from './input.js';
import { LEVEL_SCENES, allDifferencesOn } from './scenes.js';
import { SCREEN_LEVEL_DONE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TIME_UP, SCREEN_TITLE, SCREEN_WIN, remainingCount } from './world.js';

const CREAM = '#fff3d6';
const GOLD = '#ffc94d';
const TEAL = '#3fc1b0';
const ROSE = '#ff7d9c';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawPanel(ctx, levelIndex, mods, time, panelX) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT);
  ctx.clip();
  ctx.translate(panelX, PANEL_Y);
  LEVEL_SCENES[levelIndex].draw(ctx, mods, time);
  ctx.restore();
}

/** A found marker: a gold ring with a check, drawn on both pictures at once. */
function drawMarker(ctx, panelX, x, y) {
  const centreX = panelX + x;
  const centreY = PANEL_Y + y;
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = GOLD;
  ctx.beginPath();
  ctx.arc(centreX, centreY, 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 243, 214, 0.9)';
  ctx.beginPath();
  ctx.arc(centreX, centreY, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centreX - 8, centreY + 1);
  ctx.lineTo(centreX - 2, centreY + 7);
  ctx.lineTo(centreX + 9, centreY - 6);
  ctx.stroke();
  ctx.restore();
}

/** A red cross where a wrong click landed, fading with its age. */
function drawMiss(ctx, panelX, miss, age) {
  const alpha = Math.max(0, 1 - age / 0.9);
  const centreX = panelX + miss.x;
  const centreY = PANEL_Y + miss.y;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ff5a4d';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centreX - 10, centreY - 10);
  ctx.lineTo(centreX + 10, centreY + 10);
  ctx.moveTo(centreX + 10, centreY - 10);
  ctx.lineTo(centreX - 10, centreY + 10);
  ctx.stroke();
  ctx.restore();
}

function drawTimer(ctx, level) {
  const barX = 470;
  const barY = 22;
  const barWidth = 340;
  const barHeight = 14;
  const levelDef = LEVELS[level.levelIndex];
  const fraction = Math.max(0, level.timeLeft / levelDef.timeLimit);
  const urgent = level.timeLeft <= 30;
  ctx.fillStyle = 'rgba(255, 243, 214, 0.16)';
  roundRect(ctx, barX, barY, barWidth, barHeight, 7);
  ctx.fill();
  ctx.fillStyle = urgent ? '#ff5a4d' : TEAL;
  if (fraction > 0) {
    roundRect(ctx, barX, barY, barWidth * fraction, barHeight, 7);
    ctx.fill();
  }
  const minutes = Math.floor(level.timeLeft / 60);
  const seconds = Math.floor(level.timeLeft % 60);
  ctx.fillStyle = urgent ? '#ff8a7a' : CREAM;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, barX + barWidth + 10, barY + barHeight / 2);
}

function drawHeader(ctx, world, muted) {
  ctx.fillStyle = '#0e1526';
  ctx.fillRect(0, 0, VIEW_WIDTH, HEADER_HEIGHT);
  ctx.fillStyle = 'rgba(255, 201, 77, 0.25)';
  ctx.fillRect(0, HEADER_HEIGHT - 2, VIEW_WIDTH, 2);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Firefly Hollow', 36, 31);
  ctx.fillStyle = CREAM;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`Level ${world.level.levelIndex + 1} of 3 · ${LEVELS[world.level.levelIndex].name}`, 250, 32);
  // Level dots, under the level name.
  for (let index = 0; index < 3; index += 1) {
    ctx.fillStyle = index < world.level.levelIndex ? GOLD : index === world.level.levelIndex ? TEAL : 'rgba(255, 243, 214, 0.3)';
    ctx.beginPath();
    ctx.arc(330 + index * 16, 50, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  drawTimer(ctx, world.level);
  // The counter of differences left: the number the brief asks to see.
  const remaining = remainingCount(world.level);
  ctx.textAlign = 'right';
  ctx.fillStyle = remaining === 0 ? TEAL : GOLD;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`${remaining} left`, 1052, 26);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('differences', 1052, 46);
  // Score.
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${world.score}`, 880, 32);
  // Hint button with its remaining count.
  ctx.fillStyle = world.level.hintsLeft > 0 ? '#3a2c12' : 'rgba(255, 243, 214, 0.12)';
  roundRect(ctx, HINT_BUTTON.x, HINT_BUTTON.y, HINT_BUTTON.width, HINT_BUTTON.height, 8);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  roundRect(ctx, HINT_BUTTON.x, HINT_BUTTON.y, HINT_BUTTON.width, HINT_BUTTON.height, 8);
  ctx.stroke();
  ctx.fillStyle = world.level.hintsLeft > 0 ? GOLD : 'rgba(255, 243, 214, 0.5)';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Hint (${world.level.hintsLeft})`, HINT_BUTTON.x + HINT_BUTTON.width / 2, HINT_BUTTON.y + 17);
  // Sound button.
  ctx.fillStyle = '#1d2a44';
  roundRect(ctx, SOUND_BUTTON.x, SOUND_BUTTON.y, SOUND_BUTTON.width, SOUND_BUTTON.height, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 243, 214, 0.5)';
  roundRect(ctx, SOUND_BUTTON.x, SOUND_BUTTON.y, SOUND_BUTTON.width, SOUND_BUTTON.height, 8);
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(muted ? 'Muted' : 'Sound', SOUND_BUTTON.x + SOUND_BUTTON.width / 2, SOUND_BUTTON.y + 17);
}

function drawFooter(ctx, world) {
  ctx.fillStyle = '#0e1526';
  ctx.fillRect(0, FOOTER_Y, VIEW_WIDTH, FOOTER_HEIGHT);
  ctx.fillStyle = CREAM;
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.level.message, 36, FOOTER_Y + FOOTER_HEIGHT / 2);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.55)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Click a difference · Arrows move · Enter clicks · H hint · P pause · M sound', 1244, FOOTER_Y + FOOTER_HEIGHT / 2);
}

function drawPanels(ctx, world, time) {
  const levelIndex = world.level.levelIndex;
  // Panel frames.
  for (const panelX of [PANEL_LEFT_X, PANEL_RIGHT_X]) {
    ctx.fillStyle = '#0a0f1e';
    roundRect(ctx, panelX - 4, PANEL_Y - 4, PANEL_WIDTH + 8, PANEL_HEIGHT + 8, 10);
    ctx.fill();
  }
  drawPanel(ctx, levelIndex, {}, time, PANEL_LEFT_X);
  drawPanel(ctx, levelIndex, allDifferencesOn(levelIndex), time, PANEL_RIGHT_X);
  // Picture tags.
  for (const [panelX, tag] of [[PANEL_LEFT_X, 'A'], [PANEL_RIGHT_X, 'B']]) {
    ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
    roundRect(ctx, panelX + 8, PANEL_Y + 8, 28, 28, 8);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, panelX + 22, PANEL_Y + 23);
  }
  const scene = LEVEL_SCENES[levelIndex];
  // The hint ring pulses on both pictures at once.
  if (world.level.hintAt !== null) {
    const hinted = scene.differences.find((difference) => difference.id === world.level.hintAt.id);
    if (hinted !== undefined) {
      const pulse = 24 + 5 * Math.sin(time * 6);
      ctx.save();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      for (const panelX of [PANEL_LEFT_X, PANEL_RIGHT_X]) {
        ctx.beginPath();
        ctx.arc(panelX + hinted.x, PANEL_Y + hinted.y, pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Found markers on both pictures.
  for (const difference of scene.differences) {
    if (!world.level.found.has(difference.id)) continue;
    drawMarker(ctx, PANEL_LEFT_X, difference.x, difference.y);
    drawMarker(ctx, PANEL_RIGHT_X, difference.x, difference.y);
  }
  // Miss crosses, wherever they landed.
  for (const miss of world.level.misses) {
    const age = world.level.elapsed - miss.at;
    drawMiss(ctx, PANEL_LEFT_X, miss, age);
    drawMiss(ctx, PANEL_RIGHT_X, miss, age);
  }
  // The keyboard crosshair.
  if (world.screen === SCREEN_PLAY) {
    const panelX = world.cursor.panel === 0 ? PANEL_LEFT_X : PANEL_RIGHT_X;
    const cx = panelX + world.cursor.x;
    const cy = PANEL_Y + world.cursor.y;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 243, 214, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy);
    ctx.lineTo(cx - 6, cy);
    ctx.moveTo(cx + 6, cy);
    ctx.lineTo(cx + 18, cy);
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy - 6);
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, cy + 18);
    ctx.stroke();
    ctx.restore();
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 12, 24, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#141d33';
  roundRect(ctx, 340, 96, 600, 288, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, 340, 96, 600, 288, 16);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 640, 150);
  ctx.fillStyle = CREAM;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, 640, 200 + index * 30);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * ratio);
    canvas.height = Math.floor(canvas.clientHeight * ratio);
  }

  window.addEventListener('resize', resize);
  resize();

  return {
    resize,
    draw(world, screen, best, time, muted) {
      const ratio = window.devicePixelRatio || 1;
      const scale = Math.min(canvas.width / ratio / VIEW_WIDTH, canvas.height / ratio / VIEW_HEIGHT);
      ctx.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * (canvas.width / ratio - VIEW_WIDTH * scale) / 2, ratio * (canvas.height / ratio - VIEW_HEIGHT * scale) / 2);
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(-100, -100, VIEW_WIDTH + 200, VIEW_HEIGHT + 200);
      if (screen === SCREEN_TITLE) {
        drawHeader(ctx, world, muted);
        drawPanels(ctx, world, time);
        drawFooter(ctx, world);
        drawOverlay(ctx, 'Firefly Hollow', [
          'Two pictures of the same night — almost the same.',
          'Find all 7 differences in each of three scenes.',
          'Click a difference in either picture. Hints cost 50 points.',
          '',
          best > 0 ? `Best score: ${best}` : 'Your best score will live here.',
          'Click or press Enter to begin.',
        ], GOLD);
        return;
      }
      drawHeader(ctx, world, muted);
      drawPanels(ctx, world, time);
      drawFooter(ctx, world);
      if (screen === SCREEN_PAUSED) {
        drawOverlay(ctx, 'Paused', ['The fireflies wait for you.', 'Press P or click to keep hunting.'], TEAL);
      } else if (screen === SCREEN_LEVEL_DONE) {
        const last = world.level.levelIndex + 1 >= LEVELS.length;
        drawOverlay(ctx, last ? 'Scene Complete!' : 'Level Complete!', [
          `All 7 differences found — time bonus +${world.levelBonus}.`,
          `Score: ${world.score}`,
          last ? 'That was the last scene — press Enter for your reward.' : 'Press Enter or click for the next scene.',
        ], GOLD);
      } else if (screen === SCREEN_TIME_UP) {
        drawOverlay(ctx, "Time's Up", [
          `You found ${world.level.found.size} of 7 differences.`,
          'Press R or click to try this scene again.',
        ], ROSE);
      } else if (screen === SCREEN_WIN) {
        drawOverlay(ctx, 'You Found Them All!', [
          'Three night scenes, 21 differences, every one circled.',
          `Final score: ${world.score}   ·   Best: ${Math.max(best, world.score)}`,
          'Press R or click to play again.',
        ], GOLD);
      }
    },
  };
}
