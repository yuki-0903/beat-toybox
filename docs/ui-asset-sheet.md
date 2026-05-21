# BEAT RUNNER UI Asset Sheet

Last updated: 2026-05-19

This document lists the UI elements currently used by BEAT RUNNER and proposes a unified asset naming plan for future generated UI sheets.

## Current Implementation Notes

- Main UI implementation: `game/scenes/MainScene.ts`
- Asset key definitions: `game/config/themeAssets.ts`
- Runtime UI assets: `public/assets/themes/tiny_toy_sprint/ui/`
- Runtime UI parts: `public/assets/themes/tiny_toy_sprint/ui/parts/`
- Source sheet files are kept under `public/assets/themes/tiny_toy_sprint/ui/parts/source/`, but they are not loaded by the game runtime.
- Text such as screen titles, score values, ranking rows, and feedback words is currently drawn in Phaser.
- Button, card, panel, HUD, and icon frames are loaded from image assets where available.
- Name input UI assets are already defined, but the current runtime flow does not show a custom name input screen. Ranking names currently come from localStorage fallback.
- Item UI exists in code, but normal item gameplay is currently disabled by `itemsEnabled = false`.

## UI Asset List

| Screen | UI element | Current implementation location | Current asset key / draw method | Needed image asset name |
|---|---|---|---|---|
| Start | Fullscreen start background | `game/scenes/MainScene.ts` `createPrototypeView` / `layoutBackgroundImages` | `background.start.portrait`, `background.start.landscape` | `beat_ui_bg_start_portrait_01.png`, `beat_ui_bg_start_landscape_01.png` |
| Start | START button | `game/scenes/MainScene.ts` `menuButtons`, `layoutMenuButtons` | `ui.parts.buttonPrimary` | `beat_ui_button_start_01.png` |
| Start | Ranking icon button | `game/scenes/MainScene.ts` `menuButtons`, `tryPressMenuButton` | `ui.parts.iconTrophy` | `beat_ui_icon_button_ranking_01.png` |
| Start | Settings icon button | `game/scenes/MainScene.ts` `menuButtons`, `tryPressMenuButton` | `ui.parts.iconGear` | `beat_ui_icon_button_settings_01.png` |
| Start | Help icon button | `game/scenes/MainScene.ts` `menuButtons`, `tryPressMenuButton` | `ui.parts.iconHelp` | `beat_ui_icon_button_help_01.png` |
| Music Select | Fullscreen menu background | `game/scenes/MainScene.ts` `layoutBackgroundImages` | `background.menu.portrait`, `background.menu.landscape` | `beat_ui_bg_menu_portrait_01.png`, `beat_ui_bg_menu_landscape_01.png` |
| Music Select | Screen title banner | `game/scenes/MainScene.ts` `songSelectTitleImage`, `layoutSongButtons` | `ui.parts.titleBanner`; title text is currently hidden on this screen | `beat_ui_panel_title_banner_01.png` |
| Music Select | Main song card | `game/scenes/MainScene.ts` `songButtons`, `layoutSongButtons` | `ui.parts.songCardLarge` | `beat_ui_card_song_main_01.png` |
| Music Select | Side song card | `game/scenes/MainScene.ts` `songButtons`, `layoutSongButtons` | currently also uses `ui.parts.songCardLarge`; `songCardSide` exists | `beat_ui_card_song_side_01.png` |
| Music Select | Song thumbnail area | `game/scenes/MainScene.ts` `layoutSongButtons` | Phaser rectangles | `beat_ui_card_song_thumbnail_mask_01.png` |
| Music Select | Song BPM / star text | `game/scenes/MainScene.ts` `layoutSongButtons` | Phaser text | draw in Phaser, no baked text |
| Music Select | Left arrow button | `game/scenes/MainScene.ts` `songArrowButtons` | `ui.parts.arrowLeft` | `beat_ui_button_arrow_left_01.png` |
| Music Select | Right arrow button | `game/scenes/MainScene.ts` `songArrowButtons` | `ui.parts.arrowRight` | `beat_ui_button_arrow_right_01.png` |
| Music Select | Pagination dots | `game/scenes/MainScene.ts` `songSelectPaginationImage` | `ui.parts.paginationDots` | `beat_ui_indicator_pagination_01.png` |
| Music Select | Settings button | `game/scenes/MainScene.ts` `menuButtons`, `layoutMenuButtons` | `ui.parts.iconGear` | `beat_ui_icon_button_settings_01.png` |
| Difficulty Select | Screen title banner | `game/scenes/MainScene.ts` `songSelectTitleImage`, `startLabel`, `layoutSongButtons`, `layout` | `ui.parts.titleBanner` + Phaser text | `beat_ui_panel_title_banner_01.png` |
| Difficulty Select | EASY difficulty card | `game/scenes/MainScene.ts` `difficultyButtons` | `ui.parts.difficultyEasy` | `beat_ui_card_difficulty_easy_01.png` |
| Difficulty Select | NORMAL difficulty card | `game/scenes/MainScene.ts` `difficultyButtons` | `ui.parts.difficultyNormal` | `beat_ui_card_difficulty_normal_01.png` |
| Difficulty Select | HARD difficulty card | `game/scenes/MainScene.ts` `difficultyButtons` | `ui.parts.difficultyHard` | `beat_ui_card_difficulty_hard_01.png` |
| Difficulty Select | START button | `game/scenes/MainScene.ts` `menuButtons`, `layoutMenuButtons` | `ui.parts.buttonPrimary` | `beat_ui_button_start_01.png` |
| Difficulty Select | Back button | `game/scenes/MainScene.ts` `menuButtons`, `layoutMenuButtons` | `ui.parts.arrowLeft` | `beat_ui_button_back_01.png` |
| Difficulty Select | Settings button | `game/scenes/MainScene.ts` `menuButtons`, `layoutMenuButtons` | `ui.parts.iconGear` | `beat_ui_icon_button_settings_01.png` |
| Game HUD | SCORE sticker | `game/scenes/MainScene.ts` `scoreStickerImage`, `scoreLabel`, `layoutHudAssetImages` | `ui.parts.hudScore` + Phaser text | `beat_ui_hud_score_badge_01.png` |
| Game HUD | COMBO sticker | `game/scenes/MainScene.ts` `comboBadgeImage`, `comboLabel`, `layoutHudAssetImages` | `ui.parts.hudCombo` + Phaser text | `beat_ui_hud_combo_badge_01.png` |
| Game HUD | MISS sticker | `game/scenes/MainScene.ts` `missStickerImage`, `missLabel`, `layoutHudAssetImages` | `ui.parts.hudMiss` + Phaser text | `beat_ui_hud_miss_badge_01.png` |
| Game HUD | FEVER badge | `game/scenes/MainScene.ts` `feverBadgeImage`, `feverLabel`, `setFeverActive` | `ui.parts.hudFever` + Phaser text/effects | `beat_ui_hud_fever_badge_01.png` |
| Game HUD | FEVER gauge stars | `game/scenes/MainScene.ts` `drawHudStickers` | Phaser graphics | `beat_ui_hud_fever_star_01.png` |
| Game HUD | Result text | `game/scenes/MainScene.ts` `resultLabel`, `popResult` | Phaser text | `beat_ui_panel_result_01.png` |
| Name Input | Name input panel | `game/config/themeAssets.ts` only; custom screen not currently shown | `ui.parts.nameInputPanel` | `beat_ui_panel_name_input_01.png` |
| Name Input | Keyboard key | `game/config/themeAssets.ts` only; custom screen not currently shown | `ui.parts.keyboardKey` | `beat_ui_key_name_input_01.png` |
| Name Input | OK button | `game/config/themeAssets.ts` only; custom screen not currently shown | `ui.parts.okButton` | `beat_ui_button_ok_01.png` |
| Ranking | Screen title / header | `game/scenes/MainScene.ts` `titleLabel`, `layoutRankingLabels` | currently text-only; no ranking-specific title banner is wired | `beat_ui_panel_title_banner_01.png` |
| Ranking | Ranking panel | `game/scenes/MainScene.ts` `rankingPanelImage`, `layoutRankingLabels` | `ui.parts.rankingPanel` | `beat_ui_panel_ranking_01.png` |
| Ranking | Ranking rows | `game/scenes/MainScene.ts` `rankingLabels` | Phaser text | draw in Phaser, no baked text |
| Ranking | Empty state text | `game/scenes/MainScene.ts` `layoutRankingLabels` | Phaser text `NO SCORES YET` | draw in Phaser, no baked text |
| Ranking | Back button | `game/scenes/MainScene.ts` `menuButtons`, `layoutMenuButtons` | `ui.parts.arrowLeft` | `beat_ui_button_back_01.png` |
| Smartphone Controls | Red lane performance button | `game/scenes/MainScene.ts` `jumpButtons`, `layoutJumpButtons` | `ui.parts.jumpButtonLeft` | `beat_ui_touch_button_red_01.png` |
| Smartphone Controls | Yellow lane performance button | `game/scenes/MainScene.ts` `jumpButtons`, `layoutJumpButtons` | `ui.parts.jumpButtonCenter` | `beat_ui_touch_button_yellow_01.png` |
| Smartphone Controls | Blue lane performance button | `game/scenes/MainScene.ts` `jumpButtons`, `layoutJumpButtons` | `ui.parts.jumpButtonRight` | `beat_ui_touch_button_blue_01.png` |
| Feedback | PERFECT / COOL / NICE text | `game/scenes/MainScene.ts` `getJudgeText`, `spawnStickerText`, `popFeedback` | Phaser text | `beat_ui_feedback_judge_sticker_01.png` |
| Feedback | MISS / REST text | `game/scenes/MainScene.ts` `registerMiss`, `spawnMissEffects` | Phaser text | `beat_ui_feedback_miss_sticker_01.png` |
| Feedback | FEVER text burst | `game/scenes/MainScene.ts` `setFeverActive`, `popFeedback` | Phaser text + particles | `beat_ui_feedback_fever_sticker_01.png` |
| Feedback | Combo milestone text | `game/scenes/MainScene.ts` `triggerComboMilestone` | Phaser text + particles | `beat_ui_feedback_combo_sticker_01.png` |
| Feedback | Item collect text | `game/scenes/MainScene.ts` `judgeItem`, `popItemCollect` | Phaser text + graphics; gameplay disabled | `beat_ui_feedback_item_sticker_01.png` |
| Stickers | Generic sticker base | `game/scenes/MainScene.ts` `spawnStickerText` | Phaser text with stroke; `ui.sticker` exists | `beat_ui_sticker_base_01.png` |
| Buttons | Primary button base | `game/config/themeAssets.ts`, `game/scenes/MainScene.ts` | `ui.parts.buttonPrimary` | `beat_ui_button_primary_01.png` |
| Buttons | Secondary button base | `game/config/themeAssets.ts` only | `ui.parts.buttonSecondary` | `beat_ui_button_secondary_01.png` |
| Buttons | Home icon button | `game/config/themeAssets.ts` only | `ui.parts.iconHome` | `beat_ui_icon_button_home_01.png` |
| Cards | Song card family | `game/scenes/MainScene.ts` `songButtons` | `ui.parts.songCardLarge`, `ui.parts.songCardSide` | `beat_ui_card_song_main_01.png`, `beat_ui_card_song_side_01.png` |
| Cards | Difficulty card family | `game/scenes/MainScene.ts` `difficultyButtons` | `ui.parts.difficultyEasy/Normal/Hard` | `beat_ui_card_difficulty_easy_01.png`, `beat_ui_card_difficulty_normal_01.png`, `beat_ui_card_difficulty_hard_01.png` |
| Panels | Title banner | `game/scenes/MainScene.ts` `songSelectTitleImage`, `layoutSongButtons` | `ui.parts.titleBanner` | `beat_ui_panel_title_banner_01.png` |
| Panels | Ranking panel | `game/scenes/MainScene.ts` `layoutRankingLabels` | `ui.parts.rankingPanel` | `beat_ui_panel_ranking_01.png` |
| Panels | Result panel | `game/scenes/MainScene.ts` `popResult` | currently text-only | `beat_ui_panel_result_01.png` |

## Proposed UI Asset Sheets

Use transparent source sheets with consistent padding and no baked text unless explicitly listed, then export runtime parts as WebP.

| Sheet | Purpose | Assets to include | Suggested filename |
|---|---|---|---|
| Menu controls sheet | Common buttons and icon buttons | primary button, secondary button, back, left arrow, right arrow, ranking icon, settings icon, help icon, home icon, OK button | `beat_ui_sheet_menu_controls_01.png` |
| Cards and panels sheet | Menu cards and large panels | title banner, song main card, song side card, difficulty EASY/NORMAL/HARD cards, ranking panel, result panel, name input panel | `beat_ui_sheet_cards_panels_01.png` |
| HUD sheet | In-game status UI | score badge, combo badge, miss badge, fever badge, fever star, small counter sticker base | `beat_ui_sheet_hud_01.png` |
| Touch controls sheet | Smartphone performance buttons | red touch button, yellow touch button, blue touch button, pressed/highlight variants | `beat_ui_sheet_touch_controls_01.png` |
| Feedback stickers sheet | Temporary judgment and pop feedback | judge sticker base, miss sticker base, fever sticker base, combo milestone sticker, item collect sticker | `beat_ui_sheet_feedback_stickers_01.png` |

## Generation Rules

- When adding, replacing, or recutting UI parts, keep source sheets under `public/assets/themes/tiny_toy_sprint/ui/parts/source/` and export runtime-ready parts into `public/assets/themes/tiny_toy_sprint/ui/parts/`.
- Cut runtime UI parts into separate transparent WebP files under `public/assets/themes/tiny_toy_sprint/ui/parts/`; do not load the full source sheet directly in gameplay.
- Style: toy-like, miniature, rhythm runner, rounded plastic, soft bevels, readable on mobile.
- Palette anchor: red `#FF6B6B`, yellow `#FFD166`, blue `#4D96FF`, cream/white highlights, warm toy shadows.
- Keep text out of assets by default. Phaser should draw labels such as `START!`, `SELECT SONG`, `SCORE`, ranking names, and judgment text.
- Exceptions where baked symbols are useful: trophy, gear, question mark, arrows, stars, music notes.
- Export every UI part as a separate transparent WebP after generating sheets.
- Keep each part centered with transparent padding so Phaser can fit it with `fitImageInBox`.
- Use strong outer rims for buttons/cards because UI often sits on bright detailed backgrounds.
- Provide normal and pressed/highlight variants for touch buttons and primary buttons.
- Avoid thin lines, small decorations, and low-contrast text areas.

## Priority

| Priority | Asset group | Reason |
|---|---|---|
| P0 | Start button, title banner, song cards, difficulty cards, HUD score/combo/miss, touch buttons | Visible in the core flow and gameplay |
| P1 | Ranking panel, arrows, settings/help/ranking icons, FEVER badge, feedback sticker bases | Visible often or important for polish |
| P2 | Name input panel, keyboard key, OK button, home icon, result panel, item collect sticker | Prepared for future flow or currently disabled paths |
