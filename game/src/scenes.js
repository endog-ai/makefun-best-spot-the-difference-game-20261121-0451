// Firefly Hollow's three night scenes, drawn from scratch on canvas: no images, no files,
// just shapes and gradients. Every scene is drawn twice — once plain for the left panel,
// once with its differences applied for the right panel — from the same `mods` object, so
// the two pictures are near-identical by construction and differ exactly where the level
// says they do.
//
// Each level exports its differences as { id, label, x, y } in panel coordinates
// (the panel is 560 by 340). A click within FIND_RADIUS of a difference finds it.
import { createRandom, range } from './random.js';

function circle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** A four-point sparkle, for stars and firefly halos. */
function sparkle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.quadraticCurveTo(x, y, x, y + radius);
  ctx.quadraticCurveTo(x, y, x - radius, y);
  ctx.quadraticCurveTo(x, y, x, y - radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function glowDot(ctx, x, y, radius, core, halo) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
  gradient.addColorStop(0, halo);
  gradient.addColorStop(1, 'rgba(255, 220, 120, 0)');
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  circle(ctx, x, y, radius, core);
}

/** A paper lantern: a ribbed round body with a cap, a tassel and a warm glow. */
function paperLantern(ctx, x, y, radius, body) {
  const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.2, x, y, radius * 1.9);
  gradient.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  gradient.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.9, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ellipse(ctx, x, y, radius, radius * 0.86, body);
  ctx.strokeStyle = 'rgba(120, 50, 20, 0.45)';
  ctx.lineWidth = 1.5;
  for (const offset of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.82, radius * 0.86 * (1 - Math.abs(offset) * 0.4), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a3b12';
  ctx.fillRect(x - radius * 0.32, y - radius * 0.98, radius * 0.64, 4);
  ctx.fillRect(x - radius * 0.32, y + radius * 0.86, radius * 0.64, 4);
  ctx.strokeStyle = '#e8b23a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + radius * 0.95);
  ctx.lineTo(x, y + radius * 1.35);
  ctx.stroke();
}

function mushroom(ctx, x, y, scale) {
  ctx.fillStyle = '#f6ead2';
  ctx.fillRect(x - 3 * scale, y - 12 * scale, 6 * scale, 12 * scale);
  ctx.beginPath();
  ctx.arc(x, y - 12 * scale, 11 * scale, Math.PI, 0);
  ctx.fillStyle = '#e2574c';
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  circle(ctx, x - 5 * scale, y - 16 * scale, 1.8 * scale, '#fff3d6');
  circle(ctx, x + 4 * scale, y - 19 * scale, 1.5 * scale, '#fff3d6');
  circle(ctx, x + 1 * scale, y - 13 * scale, 1.3 * scale, '#fff3d6');
}

function flower(ctx, x, y, petal) {
  for (let petalIndex = 0; petalIndex < 5; petalIndex += 1) {
    const angle = (petalIndex / 5) * Math.PI * 2 - Math.PI / 2;
    circle(ctx, x + Math.cos(angle) * 5, y + Math.sin(angle) * 5, 4, petal);
  }
  circle(ctx, x, y, 3.4, '#ffd94d');
}

function sittingCat(ctx, x, y, scale, tailUp, coat) {
  ctx.fillStyle = coat;
  ellipse(ctx, x, y, 13 * scale, 17 * scale, coat); // body
  circle(ctx, x + 2 * scale, y - 20 * scale, 10 * scale, coat); // head
  ctx.beginPath(); // ears
  ctx.moveTo(x - 5 * scale, y - 26 * scale);
  ctx.lineTo(x - 8 * scale, y - 36 * scale);
  ctx.lineTo(x - 1 * scale, y - 29 * scale);
  ctx.moveTo(x + 9 * scale, y - 26 * scale);
  ctx.lineTo(x + 12 * scale, y - 36 * scale);
  ctx.lineTo(x + 5 * scale, y - 29 * scale);
  ctx.fill();
  if (tailUp) {
    ctx.strokeStyle = coat;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 12 * scale, y + 12 * scale);
    ctx.quadraticCurveTo(x - 24 * scale, y + 2 * scale, x - 20 * scale, y - 14 * scale);
    ctx.stroke();
  } else {
    ctx.strokeStyle = coat;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 12 * scale, y + 12 * scale);
    ctx.quadraticCurveTo(x - 22 * scale, y + 16 * scale, x - 26 * scale, y + 15 * scale);
    ctx.stroke();
  }
  circle(ctx, x - 1 * scale, y - 22 * scale, 1.4, '#1c2438'); // eye
  circle(ctx, x + 6 * scale, y - 22 * scale, 1.4, '#1c2438');
}

function nightSky(ctx, width, height, top, middle, bottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.6, middle);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function starField(ctx, random, count, maxY, extra) {
  for (let index = 0; index < count; index += 1) {
    const x = range(random, 12, 548);
    const y = range(random, 10, maxY);
    const radius = range(random, 1, 2.4);
    circle(ctx, x, y, radius, 'rgba(255, 244, 200, 0.9)');
  }
  if (extra) sparkle(ctx, extra.x, extra.y, 7, '#ffe9a8');
}

// ---------------------------------------------------------------- level 1
function drawHollow(ctx, mods, time) {
  const random = createRandom(101);
  nightSky(ctx, 560, 340, '#141d33', '#274b63', '#3a6b5a');
  starField(ctx, random, 26, 130, mods.star ? { x: 90, y: 60 } : null);
  // Moon with three craters; one crater fades in the right panel.
  circle(ctx, 470, 58, 30, '#ffeec2');
  circle(ctx, 460, 50, 5, '#e8cf96');
  circle(ctx, 482, 66, 6.5, '#e8cf96');
  if (!mods.crater) circle(ctx, 478, 48, 4, '#e8cf96');
  // Distant hills.
  ctx.fillStyle = '#1e3a2f';
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.quadraticCurveTo(140, 185, 300, 225);
  ctx.quadraticCurveTo(430, 255, 560, 210);
  ctx.lineTo(560, 340);
  ctx.lineTo(0, 340);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#16301f';
  ctx.beginPath();
  ctx.moveTo(0, 265);
  ctx.quadraticCurveTo(180, 220, 360, 258);
  ctx.quadraticCurveTo(480, 280, 560, 250);
  ctx.lineTo(560, 340);
  ctx.lineTo(0, 340);
  ctx.closePath();
  ctx.fill();
  // The old tree on the left.
  ctx.strokeStyle = '#2c1f14';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(72, 340);
  ctx.quadraticCurveTo(66, 240, 78, 150);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(76, 190);
  ctx.quadraticCurveTo(120, 150, 170, 128);
  ctx.stroke();
  circle(ctx, 60, 105, 42, '#1d4a2e');
  circle(ctx, 105, 82, 36, '#256038');
  circle(ctx, 138, 118, 30, '#1d4a2e');
  circle(ctx, 78, 140, 28, '#256038');
  // A string of paper lanterns between the tree and a pole.
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 108);
  ctx.quadraticCurveTo(300, 132, 470, 100);
  ctx.stroke();
  const sway = Math.sin(time * 0.8) * 2;
  paperLantern(ctx, 196, 128 + sway, 15, '#ff9e3d');
  paperLantern(ctx, 292, 134 - sway, 17, mods.lantern ? '#3fc1b0' : '#ff9e3d');
  paperLantern(ctx, 392, 126 + sway, 15, '#ff9e3d');
  // The pond, bottom left, with ripples.
  ellipse(ctx, 165, 302, 105, 34, '#1d4a66');
  ellipse(ctx, 165, 300, 96, 29, '#2b6a84');
  ctx.strokeStyle = 'rgba(190, 230, 255, 0.5)';
  ctx.lineWidth = 2;
  for (const [rx, ry] of [[40, 6], [62, 10], [22, 4]]) {
    ctx.beginPath();
    ctx.ellipse(150, 302, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  // Grass band and flowers.
  ctx.fillStyle = '#173d24';
  ctx.fillRect(0, 308, 560, 32);
  flower(ctx, 150, 318, '#ff7d9c');
  flower(ctx, 232, 326, '#ffd94d');
  flower(ctx, 320, 320, mods.flower ? '#ffd94d' : '#ff7d9c');
  flower(ctx, 382, 328, '#fff3d6');
  flower(ctx, 502, 322, '#ff7d9c');
  // Mushrooms, bottom right; the middle one vanishes on the right.
  mushroom(ctx, 430, 312, 1);
  if (!mods.mushroom) mushroom(ctx, 456, 318, 1.15);
  mushroom(ctx, 480, 310, 0.9);
  // The garden cat on its stone, tail up — or tucked down.
  ellipse(ctx, 512, 268, 34, 12, '#5a5148');
  sittingCat(ctx, 508, 262, 1, !mods.cattail, '#3a3340');
  // Fireflies drift and blink; one blinks out on the right.
  const fireflies = [[120, 178], [200, 148], [260, 200], [330, 158], [400, 188], [450, 138], [182, 228], [360, 228]];
  fireflies.forEach(([x, y], index) => {
    if (mods.firefly && index === 2) return;
    const bob = Math.sin(time * 1.3 + index * 1.7) * 4;
    const blink = 0.65 + 0.35 * Math.sin(time * 2.1 + index * 2.3);
    glowDot(ctx, x, y + bob, 2.6, `rgba(255, 236, 140, ${blink})`, `rgba(255, 220, 120, ${0.5 * blink})`);
  });
}

const HOLLOW_DIFFERENCES = [
  { id: 'firefly', label: 'a firefly blinks out', x: 260, y: 200 },
  { id: 'lantern', label: 'the middle lantern turns teal', x: 292, y: 134 },
  { id: 'mushroom', label: 'a mushroom vanishes', x: 456, y: 312 },
  { id: 'star', label: 'an extra star appears', x: 90, y: 60 },
  { id: 'cattail', label: 'the cat lowers its tail', x: 496, y: 250 },
  { id: 'flower', label: 'a pink flower turns yellow', x: 320, y: 320 },
  { id: 'crater', label: 'a crater fades from the moon', x: 478, y: 48 },
];

// ---------------------------------------------------------------- level 2
function drawMarket(ctx, mods, time) {
  const random = createRandom(202);
  nightSky(ctx, 560, 340, '#241a3d', '#4a2c55', '#8a4a3a');
  starField(ctx, random, 18, 90, null);
  // A house behind the stalls, with two lit windows; one goes dark on the right.
  ctx.fillStyle = '#2e2140';
  ctx.fillRect(330, 18, 200, 90);
  ctx.beginPath();
  ctx.moveTo(320, 20);
  ctx.lineTo(430, -14);
  ctx.lineTo(540, 20);
  ctx.closePath();
  ctx.fillStyle = '#3a2c52';
  ctx.fill();
  ctx.fillStyle = '#ffd97a';
  ctx.fillRect(352, 34, 26, 30);
  ctx.fillStyle = mods.window ? '#241a33' : '#ffd97a';
  ctx.fillRect(412, 34, 26, 30);
  ctx.strokeStyle = '#241a33';
  ctx.lineWidth = 2;
  ctx.strokeRect(352, 34, 26, 30);
  ctx.strokeRect(412, 34, 26, 30);
  // Festival string lights across the top.
  ctx.strokeStyle = '#1c1428';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.quadraticCurveTo(280, 64, 560, 22);
  ctx.stroke();
  for (let index = 0; index < 12; index += 1) {
    const t = index / 11;
    const x = t * 560;
    const y = 26 + Math.sin(t * Math.PI) * 30 + 12;
    glowDot(ctx, x, y, 3, ['#ffd94d', '#ff7d9c', '#7ad9c1'][index % 3], 'rgba(255, 220, 120, 0.35)');
  }
  // The hanging sign between the stalls: a crescent moon — or a star.
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(280, 52);
  ctx.lineTo(280, 74);
  ctx.stroke();
  circle(ctx, 280, 92, 17, '#fff3d6');
  if (mods.sign) {
    sparkle(ctx, 280, 92, 10, '#e8a13a');
  } else {
    circle(ctx, 286, 88, 13, '#2e2140');
  }
  // Left stall: rose-striped awning, apple basket, crates.
  ctx.fillStyle = '#4a2c1e';
  ctx.fillRect(52, 108, 8, 190);
  ctx.fillRect(216, 108, 8, 190);
  ctx.fillStyle = '#7a4a28';
  ctx.fillRect(44, 196, 188, 102);
  for (let stripe = 0; stripe < 6; stripe += 1) {
    const stripeX = 44 + stripe * 31.5;
    const isTeal = mods.awning && stripe === 2;
    ctx.fillStyle = stripe % 2 === 0 ? '#fff3d6' : isTeal ? '#3fc1b0' : '#e2574c';
    ctx.beginPath();
    ctx.moveTo(stripeX, 96);
    ctx.lineTo(stripeX + 31.5, 96);
    ctx.lineTo(stripeX + 26, 116);
    ctx.lineTo(stripeX + 5, 116);
    ctx.closePath();
    ctx.fill();
  }
  ellipse(ctx, 138, 182, 52, 16, '#8a5a2e');
  circle(ctx, 118, 172, 9, '#e2574c');
  if (!mods.apple) circle(ctx, 140, 168, 9, '#e2574c');
  circle(ctx, 158, 174, 9, '#e2574c');
  // Crates by the left stall; the right panel stacks one more on top.
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(48, 282, 34, 26);
  ctx.fillRect(48, 254, 34, 26);
  if (mods.crate) ctx.fillRect(48, 226, 34, 26);
  ctx.strokeStyle = '#5a4020';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 282, 34, 26);
  ctx.strokeRect(48, 254, 34, 26);
  if (mods.crate) ctx.strokeRect(48, 226, 34, 26);
  // Right stall: teal-striped awning, jars, and a cat asleep on its roof.
  ctx.fillStyle = '#1e3a34';
  ctx.fillRect(336, 108, 8, 190);
  ctx.fillRect(500, 108, 8, 190);
  ctx.fillStyle = '#2c5a48';
  ctx.fillRect(328, 196, 188, 102);
  for (let stripe = 0; stripe < 6; stripe += 1) {
    const stripeX = 328 + stripe * 31.5;
    ctx.fillStyle = stripe % 2 === 0 ? '#fff3d6' : '#3fc1b0';
    ctx.beginPath();
    ctx.moveTo(stripeX, 96);
    ctx.lineTo(stripeX + 31.5, 96);
    ctx.lineTo(stripeX + 26, 116);
    ctx.lineTo(stripeX + 5, 116);
    ctx.closePath();
    ctx.fill();
  }
  for (const [jarX, jam] of [[372, '#e2574c'], [408, '#ffd94d'], [444, '#ff7d9c']]) {
    ctx.fillStyle = jam;
    ctx.fillRect(jarX - 10, 168, 20, 26);
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(jarX - 12, 164, 24, 6);
  }
  if (!mods.roofcat) {
    ellipse(ctx, 424, 92, 20, 8, '#2b2438');
    circle(ctx, 440, 86, 8, '#2b2438');
  }
  // The tall pole lantern at the far right; it is gone on the right panel.
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(534, 60, 6, 260);
  if (!mods.polelantern) paperLantern(ctx, 522, 96 + Math.sin(time * 0.9) * 2, 14, '#ff5a3d');
  // Cobbles.
  ctx.fillStyle = '#3a2c4a';
  ctx.fillRect(0, 298, 560, 42);
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.14)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      ctx.strokeRect(10 + col * 62, 306 + row * 18, 52, 14);
    }
  }
}

const MARKET_DIFFERENCES = [
  { id: 'awning', label: 'an awning stripe turns teal', x: 122, y: 106 },
  { id: 'polelantern', label: 'the pole lantern is gone', x: 522, y: 96 },
  { id: 'apple', label: 'an apple leaves the basket', x: 140, y: 168 },
  { id: 'sign', label: 'the moon sign becomes a star', x: 280, y: 92 },
  { id: 'roofcat', label: 'the cat leaves the roof', x: 424, y: 88 },
  { id: 'window', label: 'a window goes dark', x: 425, y: 49 },
  { id: 'crate', label: 'an extra crate appears', x: 65, y: 239 },
];

// ---------------------------------------------------------------- level 3
function drawPond(ctx, mods, time) {
  const random = createRandom(303);
  nightSky(ctx, 560, 340, '#101a30', '#1d3a55', '#1d4a4a');
  starField(ctx, random, 22, 110, null);
  // The willow droops in from the top left; one branch is shorter on the right.
  ctx.strokeStyle = '#2c4a2e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.quadraticCurveTo(30, 60, 22, 118);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 0);
  ctx.quadraticCurveTo(88, 55, 82, mods.willow ? 66 : 108);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(130, 0);
  ctx.quadraticCurveTo(140, 45, 136, 92);
  ctx.stroke();
  ctx.fillStyle = '#3a6b3a';
  for (let leaf = 0; leaf < 14; leaf += 1) {
    const lx = range(random, 8, 150);
    const ly = range(random, 20, 110);
    ellipse(ctx, lx, ly, 7, 3.5, '#3a6b3a');
  }
  // The big moon and its shimmering reflection on the water.
  circle(ctx, 280, 62, 36, '#ffeec2');
  circle(ctx, 268, 52, 6, '#e8cf96');
  circle(ctx, 292, 72, 8, '#e8cf96');
  circle(ctx, 288, 48, 4.5, '#e8cf96');
  ctx.fillStyle = '#16324a';
  ctx.fillRect(0, 168, 560, 172);
  const water = ctx.createLinearGradient(0, 168, 0, 340);
  water.addColorStop(0, '#1d4a66');
  water.addColorStop(1, '#0f2a3d');
  ctx.fillStyle = water;
  ctx.fillRect(0, 168, 560, 172);
  ctx.strokeStyle = 'rgba(255, 238, 194, 0.55)';
  ctx.lineWidth = 3;
  for (let stroke = 0; stroke < 6; stroke += 1) {
    if (mods.reflection && stroke === 2) continue;
    const y = 196 + stroke * 22;
    const wobble = Math.sin(time * 1.1 + stroke) * 6;
    ctx.beginPath();
    ctx.moveTo(252 + wobble, y);
    ctx.lineTo(308 - wobble, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(190, 230, 255, 0.25)';
  ctx.lineWidth = 1.5;
  for (let ripple = 0; ripple < 5; ripple += 1) {
    const y = 180 + ripple * 32;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(540, y);
    ctx.stroke();
  }
  // Reeds on both banks; one reed on the right bank is missing on the right.
  ctx.strokeStyle = '#2c6b3a';
  ctx.lineWidth = 3;
  for (const [rx, top] of [[44, 150], [62, 138], [80, 158], [486, 152], [504, 140], [522, 160]]) {
    if (mods.reed && rx === 504) continue;
    ctx.beginPath();
    ctx.moveTo(rx, 300);
    ctx.quadraticCurveTo(rx + 4, 220, rx, top);
    ctx.stroke();
    ellipse(ctx, rx, top - 4, 3, 9, '#7a5a2e');
  }
  // Lily pads, one with a flower that turns white on the right.
  ellipse(ctx, 150, 262, 28, 10, '#2c7a4a');
  ellipse(ctx, 300, 292, 32, 11, '#2c7a4a');
  ellipse(ctx, 424, 252, 26, 9, '#2c7a4a');
  flower(ctx, 300, 282, mods.lilyflower ? '#fff3d6' : '#ff7d9c');
  // The frog on the first pad; it hops away on the right.
  if (!mods.frog) {
    ellipse(ctx, 150, 252, 12, 9, '#4aa84a');
    circle(ctx, 143, 242, 5, '#4aa84a');
    circle(ctx, 157, 242, 5, '#4aa84a');
    circle(ctx, 143, 240, 2, '#1c2438');
    circle(ctx, 157, 240, 2, '#1c2438');
  }
  // Stones at the water's edge; one more appears on the right.
  ellipse(ctx, 60, 326, 22, 10, '#5a5148');
  ellipse(ctx, 250, 332, 26, 10, '#5a5148');
  ellipse(ctx, 500, 322, 20, 9, '#5a5148');
  if (mods.stone) ellipse(ctx, 350, 328, 18, 9, '#5a5148');
  // Fireflies over the water; one blinks out on the right.
  const fireflies = [[100, 140], [200, 110], [350, 120], [450, 150], [250, 90], [500, 110]];
  fireflies.forEach(([x, y], index) => {
    if (mods.firefly && index === 2) return;
    const bob = Math.sin(time * 1.4 + index * 2.1) * 4;
    const blink = 0.65 + 0.35 * Math.sin(time * 2.3 + index * 1.9);
    glowDot(ctx, x, y + bob, 2.6, `rgba(255, 236, 140, ${blink})`, `rgba(255, 220, 120, ${0.5 * blink})`);
  });
}

const POND_DIFFERENCES = [
  { id: 'frog', label: 'the frog hops away', x: 150, y: 248 },
  { id: 'lilyflower', label: 'the lily turns white', x: 300, y: 282 },
  { id: 'reed', label: 'a reed is missing', x: 504, y: 200 },
  { id: 'reflection', label: "the moon's reflection fades", x: 280, y: 240 },
  { id: 'stone', label: 'an extra stone appears', x: 350, y: 328 },
  { id: 'firefly', label: 'a firefly blinks out', x: 350, y: 120 },
  { id: 'willow', label: 'a willow branch is shorter', x: 82, y: 88 },
];

/** Every level's painter and its seven differences, in play order. */
export const LEVEL_SCENES = [
  { draw: drawHollow, differences: HOLLOW_DIFFERENCES },
  { draw: drawMarket, differences: MARKET_DIFFERENCES },
  { draw: drawPond, differences: POND_DIFFERENCES },
];

/** The right panel's `mods`: every difference switched on. */
export function allDifferencesOn(levelIndex) {
  const mods = {};
  for (const difference of LEVEL_SCENES[levelIndex].differences) mods[difference.id] = true;
  return mods;
}
