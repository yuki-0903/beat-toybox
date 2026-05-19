# Asset Workflow

Use this guide when adding or replacing theme assets.

## Runtime Asset Root

All runtime assets live under:

```txt
public/assets/
  audio/
  charts/
  fonts/
  themes/
```

Tiny Toy Sprint assets live under:

```txt
public/assets/themes/tiny_toy_sprint/
  background/
  characters/
  effects/
  items/
  lanes/
  obstacles/
  ui/
```

## Asset Config

Theme asset keys are defined in:

```txt
game/config/themeAssets.ts
```

The game loads assets by key. Do not hard-code image paths inside scenes when a theme asset key can be used.

Example:

```ts
this.currentThemeAssets.ui.parts.buttonPrimary
this.currentThemeAssets.characters.spriteSheets.left
this.currentThemeAssets.items.star
```

## Theme Config

Theme colors and world metadata are defined in:

```txt
game/config/themes.ts
```

Only `tiny-toy-sprint` has a full production asset set now. Other theme ids fall back to Tiny Toy Sprint assets until their own files are added.

## Naming Rule

Use:

```txt
tinytoy_category_name_variant.ext
```

Examples:

```txt
tinytoy_character_runner_red_front_sheet_01.png
tinytoy_ui_button_primary_red_01.png
tinytoy_item_keyboard_car_01.png
tinytoy_bg_start_sp_musicband_01.png
```

## Current Important Assets

### Characters

The current characters are front-facing music-band toys.

Runtime sprite sheets:

```txt
public/assets/themes/tiny_toy_sprint/characters/tinytoy_character_runner_red_front_sheet_01.png
public/assets/themes/tiny_toy_sprint/characters/tinytoy_character_runner_yellow_front_sheet_01.png
public/assets/themes/tiny_toy_sprint/characters/tinytoy_character_runner_blue_front_sheet_01.png
```

Each sheet uses 512x512 frames.

### UI

Important UI parts:

```txt
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_button_primary_red_01.png
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_song_card_large_01.png
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_difficulty_easy_01.png
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_difficulty_normal_01.png
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_difficulty_hard_01.png
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_arrow_left_toy_gray_01.svg
public/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_icon_gear_01.png
```

### Fonts

Fredoka is bundled locally:

```txt
public/assets/fonts/Fredoka-Regular.ttf
public/assets/fonts/Fredoka-SemiBold.ttf
public/assets/fonts/Fredoka-Bold.ttf
```

CSS registration lives in `app/globals.css`.

## Source Images

Some generated source sheets are stored under `source/` directories.

Keep source images when they help regenerate or recut sprite sheets. Avoid referencing `source/` files directly in game runtime.

## Validation

Run:

```bash
npm run validate:assets
```

This checks every asset listed in `game/config/themeAssets.ts`.

For a markdown report:

```bash
npm run report:assets
```

## Dashboard

The asset dashboard is available at:

```txt
/assets
```

Implementation:

```txt
app/assets/page.tsx
```

## AI Generated Image Notes

Generated assets often need cleanup:

- keep silhouettes readable at mobile size
- avoid tiny details
- avoid text baked into assets unless the user explicitly asks
- preserve transparent padding
- check over the actual game background
- prefer strong outer rims for buttons and panels

For UI, decide early whether text is baked into the image or drawn by Phaser. Do not use both.
