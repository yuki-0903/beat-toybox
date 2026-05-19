# Balance Workflow

Use this guide for tuning game feel.

## Config Location

Shared tuning values live in:

```txt
game/config/balance.ts
```

Current important values:

```ts
GAME_BALANCE.playerZ
GAME_BALANCE.obstacleJudgeZ
GAME_BALANCE.chartApproachTimeScale
GAME_BALANCE.obstacleSpawnZ
GAME_BALANCE.obstacleDespawnZ
GAME_BALANCE.obstacleBaseWidth
GAME_BALANCE.obstacleBaseHeight
GAME_BALANCE.feverComboThreshold
```

Some names still say `obstacle` because the implementation evolved from an obstacle runner. In current design, these are rhythm cue timing values.

## Difficulty

Difficulty buttons are:

- EASY
- NORMAL
- HARD

The game can thin or densify chart events per difficulty. Prefer changing one variable at a time and testing in the browser.

## Feel Priorities

Prioritize:

1. Taps feel responsive.
2. Character SE lands close to the beat.
3. Incoming cues are readable.
4. Misses are understandable without feeling harsh.
5. FEVER feels lively but does not hide cues.

## Tuning Process

1. Change one value.
2. Run the local game.
3. Test PC and SP portrait if the change affects layout/input.
4. Keep the change only if the user confirms the feel.

## Avoid

- hidden difficulty increases over time unless explicitly designed
- cue density that requires constant perfect timing
- camera shake that causes motion sickness
- particles that cover cues
- button sizes that are too small on phone
