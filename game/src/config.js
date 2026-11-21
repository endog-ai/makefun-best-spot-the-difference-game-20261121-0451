// Firefly Hollow: the numbers every other file agrees on.
// The game draws in one logical frame, 1280 by 480, and the renderer scales it to the
// window, so a screenshot at exactly 1280 by 480 shows the frame one to one.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 480;

export const HEADER_HEIGHT = 60;
export const PANEL_Y = 72;
export const PANEL_WIDTH = 560;
export const PANEL_HEIGHT = 340;
export const PANEL_LEFT_X = 36;
export const PANEL_RIGHT_X = 684;
export const FOOTER_Y = 424;
export const FOOTER_HEIGHT = 44;

/** A click within this many panel pixels of a difference counts as a find. */
export const FIND_RADIUS = 26;
/** How long a found marker takes to bloom, in seconds. */
export const MARK_BLOOM_SECONDS = 0.35;
/** How long a wrong click's red cross stays on screen, in seconds. */
export const MISS_FADE_SECONDS = 0.9;
/** How long a hint's golden ring pulses around its difference, in seconds. */
export const HINT_SECONDS = 2.5;
/** Hints per level. */
export const HINTS_PER_LEVEL = 3;
/** Points for a find, and the penalty for a wrong click. */
export const POINTS_PER_FIND = 100;
export const POINTS_PER_MISS = 10;
/** What a hint costs. */
export const POINTS_PER_HINT = 50;

export const BEST_KEY = 'firefly-hollow-best';

/** The three night scenes, in order, with their time limits in seconds. */
export const LEVELS = [
  { name: 'Firefly Hollow', timeLimit: 150, seed: 101 },
  { name: 'Lantern Market', timeLimit: 150, seed: 202 },
  { name: 'Moonlit Pond', timeLimit: 180, seed: 303 },
];

/** Warm paper-lantern palette shared by every scene. */
export const PALETTE = {
  ink: '#1c2438',
  cream: '#fff3d6',
  gold: '#ffc94d',
  teal: '#3fc1b0',
  rose: '#ff7d9c',
};
