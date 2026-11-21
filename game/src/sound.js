// Firefly Hollow's sounds, all synthesized with the Web Audio API — no audio files.
// A find rings a bright little arpeggio, a miss thuds low, a hint shimmers, and a
// finished level plays a short fanfare. Nothing is created until the first gesture,
// so the game never surprises a browser's autoplay rules.
export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (AudioContext === undefined) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  /** One oscillator note: frequency, when it starts, how long, what shape, how loud. */
  function note(frequency, delay, duration, type, volume) {
    const audio = ensure();
    if (audio === null || muted) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, audio.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, audio.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(audio.currentTime + delay);
    oscillator.stop(audio.currentTime + delay + duration + 0.05);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMuted() {
      muted = !muted;
      return muted;
    },
    unlock() {
      ensure();
    },
    found() {
      note(660, 0, 0.18, 'sine', 0.22);
      note(880, 0.07, 0.2, 'sine', 0.22);
      note(1320, 0.14, 0.3, 'sine', 0.18);
    },
    miss() {
      note(160, 0, 0.22, 'triangle', 0.2);
      note(110, 0.05, 0.28, 'triangle', 0.16);
    },
    hint() {
      note(1174, 0, 0.16, 'sine', 0.14);
      note(1568, 0.09, 0.24, 'sine', 0.12);
    },
    levelDone() {
      [523, 659, 784, 1046].forEach((frequency, index) => note(frequency, index * 0.11, 0.32, 'triangle', 0.2));
    },
    win() {
      [523, 659, 784, 1046, 1318, 1568].forEach((frequency, index) => note(frequency, index * 0.12, 0.4, 'triangle', 0.2));
    },
    timeUp() {
      note(392, 0, 0.3, 'sawtooth', 0.1);
      note(311, 0.18, 0.4, 'sawtooth', 0.1);
    },
  };
}
