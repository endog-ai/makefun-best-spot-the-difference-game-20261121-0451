// A tiny seeded random source (mulberry32) so a level's stars, fireflies and flowers sit
// in the same place every visit, and a screenshot seed always paints the same frame.
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max) from the seeded source. */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** One of the array's entries, picked by the seeded source. */
export function pick(random, entries) {
  return entries[Math.floor(random() * entries.length)];
}
