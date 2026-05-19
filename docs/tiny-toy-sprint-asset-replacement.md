# Tiny Toy Sprint Asset Replacement

Use this when replacing MVP SVG placeholders with generated PNG assets.

## 1. Generate P0 Images

Use:

```txt
docs/tiny-toy-sprint-p0-asset-prompts.md
```

Generate files using the exact names listed there.

## 2. Save PNG Files

Save generated files under:

```txt
public/assets/themes/tiny_toy_sprint/
```

Example:

```txt
public/assets/themes/tiny_toy_sprint/characters/tinytoy_character_runner_red_01.png
public/assets/themes/tiny_toy_sprint/obstacles/tinytoy_obstacle_mini_car_01.png
public/assets/themes/tiny_toy_sprint/items/tinytoy_item_music_note_01.png
```

## 3. Check ThemeAssetConfig

Open:

```txt
game/config/themeAssets.ts
```

Most P0 assets already have a `productionFile` value.

Example:

```ts
{
  key: "tinytoy_character_runner_red_01",
  category: "characters",
  placeholderFile: "runner_red.svg",
  productionFile: "tinytoy_character_runner_red_01.png",
  priority: "P0",
}
```

Keep the `key` stable. The game code uses the key, not the file name.

If you add a new generated asset later, add `productionFile` and `priority`.
Do not remove `placeholderFile`; it is the fallback for development.

## 4. Enable Production PNGs

By default, the game uses lightweight SVG placeholders.

After saving PNGs, start dev with:

```txt
NEXT_PUBLIC_USE_PRODUCTION_ASSETS=true npm run dev -- -H 0.0.0.0 -p 3000
```

When this flag is not set, the game keeps using placeholders.

## 5. Verify

Run:

```txt
npm run validate:assets
npm run report:assets
npm run typecheck
npm run lint
```

Then reload:

```txt
http://localhost:3000/
```

## Notes

- SVG and PNG are both supported by preload.
- SVG files use `load.svg`.
- PNG files use `load.image`.
- `npm run validate:assets` checks required placeholders and reports optional production PNG readiness.
- `npm run report:assets` outputs a Markdown checklist for generated PNG production status, grouped by P0/P1/P2 priority.
- Do not run `npm run build` while the dev server is running, because both write to `.next`.
- If a generated PNG looks cropped, add more transparent padding and regenerate.
- If an asset is too detailed on mobile, simplify the silhouette before adding more effects.
