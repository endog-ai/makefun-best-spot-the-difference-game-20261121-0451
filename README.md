[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/endog-ai/makefun-best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/endog-ai/makefun-best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Firefly Hollow — Spot the Difference

A complete, original spot-the-difference game that plays offline in a desktop
browser from its own files. Two pictures of the same night — almost the same.
Find all 7 differences in each of three hand-drawn scenes, before the timer
runs out.

## The scenes

1. **Firefly Hollow** — a night garden with a moon, paper lanterns, a pond,
   mushrooms and a cat on a stone. A firefly blinks out, a lantern turns
   teal, a mushroom vanishes…
2. **Lantern Market** — festival stalls under string lights. An awning stripe
   changes colour, an apple leaves its basket, a window goes dark…
3. **Moonlit Pond** — reeds, lily pads and a frog under a big moon. The frog
   hops away, the moon's reflection fades, a willow branch falls short…

## How to play

- **Mouse:** click a difference in either picture. **Keyboard:** arrow keys
  move the crosshair, Enter or Space clicks at it, Tab hops it to the other
  picture.
- **H** asks for a hint (a gold ring pulses around one difference still
  hiding; 3 per level, 50 points each). **P** pauses, **M** mutes, **R**
  restarts.
- A find scores 100 points; a wrong click costs 10. Finishing a scene pays a
  time bonus of 2 points per second left. Best score is kept in the browser.

## Play it

Serve `game/` with any static server and open `index.html`, for example:

```sh
node serve.ts
# open http://localhost:8080
```

No network request is made: every script, sound and picture is a file under
`game/` or drawn on canvas. Sounds are synthesized live with the Web Audio API.

## Layout

- `game/` — the playable game: `index.html` plus `src/` (one job per file:
  `config.js` numbers, `random.js` seeded random, `scenes.js` the three
  night scenes, `world.js` state and rules, `input.js` mouse and keyboard,
  `sound.js` synthesized sounds, `render.js` the painter, `shots.js` the
  screenshot scenes, `main.js` boot and loop).
- `screenshots/` — four real renders of the game's own code.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` with `buildDossier` from
  `vendor/makefun-game.ts`.
- `shots.json` — the four screenshot scenes and their URLs.

## License

MIT — see [LICENSE](LICENSE).
