# Beatmap Workflow

Use this guide when adding or replacing playable songs.

## Current Song Files

Audio files live under:

```txt
public/assets/audio/
```

Beatmap JSON files live under:

```txt
public/assets/charts/
```

Song metadata lives in:

```txt
game/config/songs.ts
```

## Add a Song

1. Put the audio file in `public/assets/audio/`.
2. Put the beatmap JSON in `public/assets/charts/`.
3. Add a `SongDefinition` entry to `game/config/songs.ts`.
4. Choose a `themeId` from `game/config/themes.ts`.
5. Run checks:

```bash
npm run typecheck
npm run lint
```

6. Start locally and verify the song in the music select screen.

## SongDefinition

```ts
{
  id: "track-id",
  title: "Track Title",
  shortTitle: "SHORT TITLE",
  bpm: 128,
  themeId: "tiny-toy-sprint",
  audioKey: "bgm_track_id",
  audioFile: "bgm_track_id.mp3",
  chartKey: "chart_track_id",
  chartFile: "beatmap-track-id.json"
}
```

Use stable `audioKey` and `chartKey` values. The user-facing file name can change, but game code should rely on keys.

## Beatmap JSON Shape

The implementation currently reads chart fields like:

```json
{
  "id": "track-id",
  "title": "Track Title",
  "bpm": 128,
  "lanes": 3,
  "duration": 80,
  "approachTime": 1.6,
  "obstacles": [
    {
      "time": 1.25,
      "lane": 0,
      "type": "block",
      "pattern": "single",
      "energy": 0.7
    }
  ],
  "items": []
}
```

## Current Design Meaning

Even though the JSON field is still named `obstacles`, the current game design treats these events as rhythm performance cues.

Use this mental model:

- `time`: when the cue reaches the player timing line
- `lane`: which character should be played
- `type`: keep `block` for now
- `pattern`: descriptive label for generated/authored patterns
- `energy`: cue intensity for visuals

Items are currently disabled in normal gameplay. Keep `items` optional or empty unless item gameplay is reintroduced.

## Difficulty

Difficulty is selected in-game as EASY / NORMAL / HARD.

Two approaches are supported:

- Use one authored dense chart and thin it per difficulty.
- Create separate charts later if the game needs custom patterns per difficulty.

For now, prefer one chart per song and tune difficulty in code until the desired feel is stable.

## Timing Notes

- `approachTime` controls how early cues spawn.
- `GAME_BALANCE.chartApproachTimeScale` globally tunes approach speed.
- If a song feels early/late, adjust chart event times or add a future global offset field.

## AI-Assisted Beatmap Creation

The desired workflow is not hand-written charting.

Recommended process:

1. Estimate BPM and duration.
2. Generate beat-aligned cue candidates.
3. Assign lanes to create playable rhythm.
4. Keep early sections simple.
5. Increase density during high-energy sections.
6. Export JSON.
7. Test in browser and tune by feel.

Avoid generating charts that require constant perfect timing. The game should feel playful, not punishing.
