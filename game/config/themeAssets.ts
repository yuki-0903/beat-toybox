import { ASSET_BASE } from "@/game/config/assets";
import type { ThemeId } from "@/game/config/themes";

type AssetCategory = "background" | "obstacles" | "items" | "ui" | "characters";
type CharacterLane = "left" | "center" | "right";

export type ThemeAssetConfig = {
  id: ThemeId;
  basePath: string;
  background: {
    decoration: string[];
    start: {
      portrait: string;
      landscape: string;
    };
    gameplay: {
      portrait: string;
      landscape: string;
    };
    fever: {
      portrait: string;
      landscape: string;
    };
  };
  obstacles: Record<string, string>;
  items: Record<string, string>;
  ui: {
    parts: {
      buttonPrimary: string;
      buttonPrimaryPressed: string;
      songCardLarge: string;
      songCardSide: string;
      titleBanner: string;
      titleLevelBanner: string;
      rankingTitle: string;
      difficultyEasy: string;
      difficultyNormal: string;
      difficultyHard: string;
      difficultyEasySelected: string;
      difficultyNormalSelected: string;
      difficultyHardSelected: string;
      hudScore: string;
      hudCombo: string;
      hudMiss: string;
      hudFever: string;
      rankingPanel: string;
      nameInputPanel: string;
      jumpButtonLeft: string;
      jumpButtonCenter: string;
      jumpButtonRight: string;
      jumpButtonLeftPressed: string;
      jumpButtonCenterPressed: string;
      jumpButtonRightPressed: string;
      arrowLeft: string;
      arrowRight: string;
      arrowLeftPressed: string;
      arrowRightPressed: string;
      iconHome: string;
      iconRetry: string;
      iconRetryPressed: string;
      iconTrophy: string;
      iconGear: string;
      iconHelp: string;
      iconTrophyPressed: string;
      iconGearPressed: string;
      iconHelpPressed: string;
    };
  };
  characters: {
    left: string;
    center: string;
    right: string;
    spriteSheets: Partial<Record<CharacterLane, string>>;
    feverSpriteSheets: Partial<Record<CharacterLane, string>>;
  };
};

type ThemeAssetFile = {
  key: string;
  category: AssetCategory;
  placeholderFile: string;
  productionFile?: string;
  frameWidth?: number;
  frameHeight?: number;
  priority: "P0" | "P1" | "P2";
};

const tinyToyThemeAssets: ThemeAssetConfig = {
  id: "tiny-toy-sprint",
  basePath: `${ASSET_BASE}/themes/tiny_toy_sprint`,
  background: {
    decoration: ["tinytoy_background_desk_surface_01"],
    start: {
      portrait: "tinytoy_background_start_sp_tiny_beat_band_01",
      landscape: "tinytoy_background_start_pc_tiny_beat_band_01"
    },
    gameplay: {
      portrait: "tinytoy_background_game_scroll_sp_03",
      landscape: "tinytoy_background_game_pc_toys_spwide_01"
    },
    fever: {
      portrait: "tinytoy_background_fever_toy_room_sp_05",
      landscape: "tinytoy_background_fever_toy_room_pc_02"
    }
  },
  obstacles: {},
  items: {
    drum: "tinytoy_item_note_red_source_04",
    bell: "tinytoy_item_note_yellow_source_04",
    toy_keyboard: "tinytoy_item_note_blue_source_04"
  },
  ui: {
    parts: {
      buttonPrimary: "tinytoy_ui_part_button_primary_red_01",
      buttonPrimaryPressed: "tinytoy_ui_part_button_primary_red_pressed_01",
      songCardLarge: "tinytoy_ui_part_song_card_large_01",
      songCardSide: "tinytoy_ui_part_song_card_side_01",
      titleBanner: "tinytoy_ui_part_title_banner_01",
      titleLevelBanner: "tinytoy_ui_part_title_level_banner_01",
      rankingTitle: "tinytoy_ui_part_ranking_title_01",
      difficultyEasy: "tinytoy_ui_part_difficulty_easy_01",
      difficultyNormal: "tinytoy_ui_part_difficulty_normal_01",
      difficultyHard: "tinytoy_ui_part_difficulty_hard_01",
      difficultyEasySelected: "tinytoy_ui_part_difficulty_easy_selected_01",
      difficultyNormalSelected: "tinytoy_ui_part_difficulty_normal_selected_01",
      difficultyHardSelected: "tinytoy_ui_part_difficulty_hard_selected_01",
      hudScore: "tinytoy_ui_part_hud_score_01",
      hudCombo: "tinytoy_ui_part_hud_combo_01",
      hudMiss: "tinytoy_ui_part_hud_miss_01",
      hudFever: "tinytoy_ui_part_hud_fever_01",
      rankingPanel: "tinytoy_ui_part_ranking_panel_01",
      nameInputPanel: "tinytoy_ui_part_name_input_panel_01",
      jumpButtonLeft: "tinytoy_ui_part_jump_button_left_01",
      jumpButtonCenter: "tinytoy_ui_part_jump_button_center_01",
      jumpButtonRight: "tinytoy_ui_part_jump_button_right_01",
      jumpButtonLeftPressed: "tinytoy_ui_part_jump_button_left_pressed_01",
      jumpButtonCenterPressed: "tinytoy_ui_part_jump_button_center_pressed_01",
      jumpButtonRightPressed: "tinytoy_ui_part_jump_button_right_pressed_01",
      arrowLeft: "tinytoy_ui_part_arrow_left_01",
      arrowRight: "tinytoy_ui_part_arrow_right_01",
      arrowLeftPressed: "tinytoy_ui_part_arrow_left_pressed_01",
      arrowRightPressed: "tinytoy_ui_part_arrow_right_pressed_01",
      iconHome: "tinytoy_ui_part_icon_home_01",
      iconRetry: "tinytoy_ui_part_icon_retry_01",
      iconRetryPressed: "tinytoy_ui_part_icon_retry_pressed_01",
      iconTrophy: "tinytoy_ui_part_icon_trophy_01",
      iconGear: "tinytoy_ui_part_icon_gear_01",
      iconHelp: "tinytoy_ui_part_icon_help_01",
      iconTrophyPressed: "tinytoy_ui_part_icon_trophy_pressed_01",
      iconGearPressed: "tinytoy_ui_part_icon_gear_pressed_01",
      iconHelpPressed: "tinytoy_ui_part_icon_help_pressed_01"
    }
  },
  characters: {
    left: "tinytoy_character_runner_red_sheet_01",
    center: "tinytoy_character_runner_yellow_sheet_01",
    right: "tinytoy_character_runner_blue_sheet_01",
    spriteSheets: {
      left: "tinytoy_character_runner_red_sheet_01",
      center: "tinytoy_character_runner_yellow_sheet_01",
      right: "tinytoy_character_runner_blue_sheet_01"
    },
    feverSpriteSheets: {
      left: "tinytoy_character_runner_red_fever_iridescent_sheet_01",
      center: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01",
      right: "tinytoy_character_runner_blue_fever_iridescent_sheet_01"
    }
  }
};

export const THEME_ASSETS: Record<ThemeId, ThemeAssetConfig> = {
  "tiny-toy-sprint": tinyToyThemeAssets,
  "lofi-chill": fallbackThemeAssets("lofi-chill"),
  "hyperpop-kawaii": fallbackThemeAssets("hyperpop-kawaii"),
  "techno-industrial": fallbackThemeAssets("techno-industrial"),
  "jazz-night-lounge": fallbackThemeAssets("jazz-night-lounge"),
  "rock-garage": fallbackThemeAssets("rock-garage"),
  "dnb-neon-city": fallbackThemeAssets("dnb-neon-city"),
  "tropical-house-beach": fallbackThemeAssets("tropical-house-beach"),
  "japanese-festival": fallbackThemeAssets("japanese-festival"),
  "fantasy-wonderland": fallbackThemeAssets("fantasy-wonderland"),
  "retro-8bit": fallbackThemeAssets("retro-8bit")
};

const useProductionAssets = process.env.NEXT_PUBLIC_USE_PRODUCTION_ASSETS === "true";

// MVP uses lightweight SVG placeholders. Drop generated runtime assets at productionFile
// paths and set NEXT_PUBLIC_USE_PRODUCTION_ASSETS=true to prefer them.
const tinyToyFiles: ThemeAssetFile[] = [
  { key: "tinytoy_background_desk_surface_01", category: "background", placeholderFile: "tinytoy_bg_desk_surface_01.webp", productionFile: "tinytoy_bg_desk_surface_01.webp", priority: "P0" },
  { key: "tinytoy_background_start_sp_tiny_beat_band_01", category: "background", placeholderFile: "tinytoy_bg_start_sp_tiny_beat_band_01.webp", productionFile: "tinytoy_bg_start_sp_tiny_beat_band_01.webp", priority: "P0" },
  { key: "tinytoy_background_start_pc_tiny_beat_band_01", category: "background", placeholderFile: "tinytoy_bg_start_pc_tiny_beat_band_01.webp", productionFile: "tinytoy_bg_start_pc_tiny_beat_band_01.webp", priority: "P0" },
  {
    key: "tinytoy_background_game_scroll_sp_03",
    category: "background",
    placeholderFile: "tinytoy_bg_game_scroll_sp_03.webp",
    productionFile: "tinytoy_bg_game_scroll_sp_03.webp",
    priority: "P0"
  },
  {
    key: "tinytoy_background_game_pc_toys_spwide_01",
    category: "background",
    placeholderFile: "tinytoy_bg_game_pc_toys_spwide_01.webp",
    productionFile: "tinytoy_bg_game_pc_toys_spwide_01.webp",
    priority: "P0"
  },
  {
    key: "tinytoy_background_fever_toy_room_pc_02",
    category: "background",
    placeholderFile: "tinytoy_bg_fever_toy_room_pc_02.webp",
    productionFile: "tinytoy_bg_fever_toy_room_pc_02.webp",
    priority: "P0"
  },
  {
    key: "tinytoy_background_fever_toy_room_sp_05",
    category: "background",
    placeholderFile: "tinytoy_bg_fever_toy_room_sp_05.webp",
    productionFile: "tinytoy_bg_fever_toy_room_sp_05.webp",
    priority: "P0"
  },
  { key: "tinytoy_item_note_red_source_04", category: "items", placeholderFile: "tinytoy_item_note_red_source_04.webp", productionFile: "tinytoy_item_note_red_source_04.webp", priority: "P0" },
  {
    key: "tinytoy_item_note_yellow_source_04",
    category: "items",
    placeholderFile: "tinytoy_item_note_yellow_source_04.webp",
    productionFile: "tinytoy_item_note_yellow_source_04.webp",
    priority: "P0"
  },
  { key: "tinytoy_item_note_blue_source_04", category: "items", placeholderFile: "tinytoy_item_note_blue_source_04.webp", productionFile: "tinytoy_item_note_blue_source_04.webp", priority: "P0" },
  { key: "tinytoy_ui_part_button_primary_red_01", category: "ui", placeholderFile: "parts/tinytoy_ui_button_primary_red_01.webp", productionFile: "parts/tinytoy_ui_button_primary_red_01.webp", priority: "P0" },
  {
    key: "tinytoy_ui_part_button_primary_red_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_button_primary_red_pressed_01.webp",
    productionFile: "parts/tinytoy_ui_button_primary_red_pressed_01.webp",
    priority: "P0"
  },
  { key: "tinytoy_ui_part_song_card_large_01", category: "ui", placeholderFile: "parts/tinytoy_ui_song_card_large_01.webp", productionFile: "parts/tinytoy_ui_song_card_large_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_song_card_side_01", category: "ui", placeholderFile: "parts/tinytoy_ui_song_card_side_01.webp", productionFile: "parts/tinytoy_ui_song_card_side_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_title_banner_01", category: "ui", placeholderFile: "parts/tinytoy_ui_title_banner_01.webp", productionFile: "parts/tinytoy_ui_title_banner_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_title_level_banner_01", category: "ui", placeholderFile: "parts/tinytoy_ui_title_level_banner_01.webp", productionFile: "parts/tinytoy_ui_title_level_banner_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_ranking_title_01", category: "ui", placeholderFile: "parts/tinytoy_ui_ranking_title_01.webp", productionFile: "parts/tinytoy_ui_ranking_title_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_outer_panel_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_outer_panel_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_outer_panel_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_logo_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_logo_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_logo_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_title_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_title_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_title_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_song_plate_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_song_plate_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_song_plate_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_difficulty_easy_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_difficulty_easy_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_difficulty_easy_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_difficulty_normal_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_difficulty_normal_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_difficulty_normal_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_difficulty_hard_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_difficulty_hard_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_difficulty_hard_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_score_frame_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_score_frame_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_score_frame_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_stats_panel_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_stats_panel_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_stats_panel_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_stat_max_combo_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_stat_max_combo_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_stat_max_combo_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_stat_perfect_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_stat_perfect_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_stat_perfect_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_stat_good_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_stat_good_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_stat_good_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_stat_nice_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_stat_nice_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_stat_nice_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_stat_miss_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_stat_miss_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_stat_miss_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_dot_divider_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_dot_divider_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_dot_divider_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_button_home_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_button_home_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_button_home_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_result_minimal_button_retry_01", category: "ui", placeholderFile: "parts/tinytoy_ui_result_minimal_button_retry_01.webp", productionFile: "parts/tinytoy_ui_result_minimal_button_retry_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_difficulty_easy_01", category: "ui", placeholderFile: "parts/tinytoy_ui_difficulty_easy_01.webp", productionFile: "parts/tinytoy_ui_difficulty_easy_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_difficulty_normal_01", category: "ui", placeholderFile: "parts/tinytoy_ui_difficulty_normal_01.webp", productionFile: "parts/tinytoy_ui_difficulty_normal_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_difficulty_hard_01", category: "ui", placeholderFile: "parts/tinytoy_ui_difficulty_hard_01.webp", productionFile: "parts/tinytoy_ui_difficulty_hard_01.webp", priority: "P0" },
  {
    key: "tinytoy_ui_part_difficulty_easy_selected_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_difficulty_easy_selected_01.webp",
    productionFile: "parts/tinytoy_ui_difficulty_easy_selected_01.webp",
    priority: "P0"
  },
  {
    key: "tinytoy_ui_part_difficulty_normal_selected_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_difficulty_normal_selected_01.webp",
    productionFile: "parts/tinytoy_ui_difficulty_normal_selected_01.webp",
    priority: "P0"
  },
  {
    key: "tinytoy_ui_part_difficulty_hard_selected_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_difficulty_hard_selected_01.webp",
    productionFile: "parts/tinytoy_ui_difficulty_hard_selected_01.webp",
    priority: "P0"
  },
  { key: "tinytoy_ui_part_hud_score_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_score_01.webp", productionFile: "parts/tinytoy_ui_hud_score_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_hud_combo_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_combo_01.webp", productionFile: "parts/tinytoy_ui_hud_combo_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_hud_miss_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_miss_01.webp", productionFile: "parts/tinytoy_ui_hud_miss_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_hud_fever_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_fever_01.webp", productionFile: "parts/tinytoy_ui_hud_fever_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_ranking_panel_01", category: "ui", placeholderFile: "parts/tinytoy_ui_ranking_panel_01.webp", productionFile: "parts/tinytoy_ui_ranking_panel_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_name_input_panel_01", category: "ui", placeholderFile: "parts/tinytoy_ui_name_input_panel_01.webp", productionFile: "parts/tinytoy_ui_name_input_panel_01.webp", priority: "P2" },
  { key: "tinytoy_ui_part_jump_button_left_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_left_01.webp", productionFile: "parts/tinytoy_ui_jump_button_left_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_center_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_center_01.webp", productionFile: "parts/tinytoy_ui_jump_button_center_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_right_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_right_01.webp", productionFile: "parts/tinytoy_ui_jump_button_right_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_left_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_left_pressed_01.webp", productionFile: "parts/tinytoy_ui_jump_button_left_pressed_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_center_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_center_pressed_01.webp", productionFile: "parts/tinytoy_ui_jump_button_center_pressed_01.webp", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_right_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_right_pressed_01.webp", productionFile: "parts/tinytoy_ui_jump_button_right_pressed_01.webp", priority: "P0" },
  {
    key: "tinytoy_ui_part_arrow_left_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_arrow_left_01.webp",
    productionFile: "parts/tinytoy_ui_arrow_left_01.webp",
    priority: "P1"
  },
  {
    key: "tinytoy_ui_part_arrow_left_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_arrow_left_pressed_01.webp",
    productionFile: "parts/tinytoy_ui_arrow_left_pressed_01.webp",
    priority: "P1"
  },
  { key: "tinytoy_ui_part_arrow_right_01", category: "ui", placeholderFile: "parts/tinytoy_ui_arrow_right_01.webp", productionFile: "parts/tinytoy_ui_arrow_right_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_arrow_right_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_arrow_right_pressed_01.webp", productionFile: "parts/tinytoy_ui_arrow_right_pressed_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_icon_home_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_home_01.webp", productionFile: "parts/tinytoy_ui_icon_home_01.webp", priority: "P1" },
  { key: "tinytoy_ui_part_icon_retry_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_retry_01.webp", productionFile: "parts/tinytoy_ui_icon_retry_01.webp", priority: "P1" },
  {
    key: "tinytoy_ui_part_icon_retry_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_icon_retry_pressed_01.webp",
    productionFile: "parts/tinytoy_ui_icon_retry_pressed_01.webp",
    priority: "P1"
  },
  { key: "tinytoy_ui_part_icon_trophy_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_trophy_01.webp", productionFile: "parts/tinytoy_ui_icon_trophy_01.webp", priority: "P2" },
  { key: "tinytoy_ui_part_icon_trophy_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_trophy_pressed_01.webp", productionFile: "parts/tinytoy_ui_icon_trophy_pressed_01.webp", priority: "P2" },
  { key: "tinytoy_ui_part_icon_gear_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_gear_01.webp", productionFile: "parts/tinytoy_ui_icon_gear_01.webp", priority: "P2" },
  { key: "tinytoy_ui_part_icon_gear_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_gear_pressed_01.webp", productionFile: "parts/tinytoy_ui_icon_gear_pressed_01.webp", priority: "P2" },
  { key: "tinytoy_ui_part_icon_help_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_help_01.webp", productionFile: "parts/tinytoy_ui_icon_help_01.webp", priority: "P2" },
  { key: "tinytoy_ui_part_icon_help_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_help_pressed_01.webp", productionFile: "parts/tinytoy_ui_icon_help_pressed_01.webp", priority: "P2" },
  {
    key: "tinytoy_character_runner_red_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_kigurumi_red_performance_sheet_01.webp",
    productionFile: "tinytoy_character_kigurumi_red_performance_sheet_01.webp",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_yellow_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_kigurumi_yellow_performance_sheet_01.webp",
    productionFile: "tinytoy_character_kigurumi_yellow_performance_sheet_01.webp",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_blue_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_kigurumi_blue_performance_sheet_01.webp",
    productionFile: "tinytoy_character_kigurumi_blue_performance_sheet_01.webp",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_red_fever_iridescent_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_runner_red_fever_iridescent_sheet_01.webp",
    productionFile: "tinytoy_character_runner_red_fever_iridescent_sheet_01.webp",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01.webp",
    productionFile: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01.webp",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_blue_fever_iridescent_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_runner_blue_fever_iridescent_sheet_01.webp",
    productionFile: "tinytoy_character_runner_blue_fever_iridescent_sheet_01.webp",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  }
];

export function getThemeAssetEntries() {
  return tinyToyFiles.map((asset) => ({
    key: asset.key,
    path: getTinyToyAssetPath(asset, useProductionAssets ? "production" : "placeholder"),
    frameWidth: asset.frameWidth,
    frameHeight: asset.frameHeight
  }));
}

export function getTinyToyAssetManifest() {
  return tinyToyFiles.map((asset) => ({
    ...asset,
    placeholderPath: getTinyToyAssetPath(asset, "placeholder"),
    productionPath: asset.productionFile ? getTinyToyAssetPath(asset, "production") : undefined
  }));
}

function getTinyToyAssetPath(asset: ThemeAssetFile, mode: "placeholder" | "production" | "runtime") {
  const file =
    mode === "production"
      ? asset.productionFile ?? asset.placeholderFile
      : mode === "placeholder"
        ? asset.placeholderFile
        : asset.productionFile ?? asset.placeholderFile;
  return `${THEME_ASSETS["tiny-toy-sprint"].basePath}/${asset.category}/${file}`;
}

function fallbackThemeAssets(id: ThemeId): ThemeAssetConfig {
  return {
    ...tinyToyThemeAssets,
    id
  };
}
