# Audio Workflow

Use this guide for BGM and SE work.

## Browser Audio Rule

Browsers block audio until the user interacts with the page.

The current game starts audio after the user enters gameplay from the menu. Do not autoplay BGM on initial page load.

## Runtime Audio Location

Audio files live in:

```txt
public/assets/audio/
```

Audio paths are loaded through:

```txt
game/config/assets.ts
game/config/songs.ts
game/scenes/PreloadScene.ts
```

## Current Audio Types

### BGM

BGM files are referenced by each `SongDefinition` in `game/config/songs.ts`.

Current examples:

```txt
bgm_main.mp3
tiny-parade-loop.mp3
sugar-tap-loop.mp3
bgm_midnight_mini_mart.wav
bgm_sushi_techno.wav
```

### Character Performance SE

Each character has a lane-specific performance sound:

```txt
se_character_red.wav
se_character_yellow.wav
se_character_blue.wav
```

These are loaded in `PreloadScene` and played from `MainScene` when the matching character successfully performs.

Current design intent:

- red: drum-like hit
- yellow: cymbal/bell-like hit
- blue: keyboard/guitar-like hit

### Legacy / Generic SE

These still exist and may be used by effects or older logic:

```txt
se_move_beat.wav
se_item_collect.wav
```

## Mixing Notes

- Character SE must be short and immediate.
- SE should cut through BGM on phone speakers.
- Avoid long tails that blur fast patterns.
- Keep character SE volumes similar across lanes.
- If tapping repeatedly feels noisy, lower volume or add rate limiting.

## Future Setting Screen

The UI already has setting buttons, but the setting screen is not implemented yet.

Future settings should include:

- BGM volume
- SE volume
- mute BGM
- mute SE

Store these values in localStorage when implemented.
