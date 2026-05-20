import { ASSET_BASE } from "@/game/config/assets";
import type { ThemeId } from "@/game/config/themes";

type AssetCategory = "background" | "lanes" | "obstacles" | "items" | "effects" | "ui" | "characters";
type CharacterLane = "left" | "center" | "right";

export type ThemeAssetConfig = {
  id: ThemeId;
  basePath: string;
  background: {
    sky: string;
    floor: string;
    decoration: string[];
    start: {
      portrait: string;
      landscape: string;
    };
    menu: {
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
  lanes: {
    left: string;
    center: string;
    right: string;
  };
  obstacles: Record<string, string>;
  items: Record<string, string>;
  ui: {
    button: string;
    sticker: string;
    fever: string;
    combo: string;
    parts: {
      buttonPrimary: string;
      buttonPrimaryPressed: string;
      buttonSecondary: string;
      buttonSecondaryPressed: string;
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
      keyboardKey: string;
      okButton: string;
      okButtonPressed: string;
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
      paginationDots: string;
    };
  };
  effects: {
    particleStar: string;
    particleNote: string;
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
    sky: "tinytoy_background_sky_01",
    floor: "tinytoy_background_floor_01",
    decoration: ["tinytoy_background_toy_block_01", "tinytoy_background_desk_surface_01", "tinytoy_background_blurred_toys_01"],
    start: {
      portrait: "tinytoy_background_start_sp_tiny_beat_band_01",
      landscape: "tinytoy_background_start_pc_tiny_beat_band_01"
    },
    menu: {
      portrait: "tinytoy_background_menu_sp_01",
      landscape: "tinytoy_background_menu_pc_01"
    },
    gameplay: {
      portrait: "tinytoy_background_game_scroll_sp_03",
      landscape: "tinytoy_background_game_scroll_sp_03"
    },
    fever: {
      portrait: "tinytoy_background_fever_toy_room_sp_05",
      landscape: "tinytoy_background_fever_neon_space_pc_01"
    }
  },
  lanes: {
    left: "tinytoy_lane_left_01",
    center: "tinytoy_lane_center_01",
    right: "tinytoy_lane_right_01"
  },
  obstacles: {
    toy_block: "tinytoy_obstacle_block_01",
    mini_car: "tinytoy_obstacle_mini_car_01",
    traffic_cone: "tinytoy_obstacle_traffic_cone_01",
    cardboard_box: "tinytoy_obstacle_cardboard_box_01",
    robot_toy: "tinytoy_obstacle_robot_toy_01"
  },
  items: {
    star: "tinytoy_item_star_01",
    music_note: "tinytoy_item_music_note_01",
    drum: "tinytoy_item_note_red_source_04",
    bell: "tinytoy_item_note_yellow_source_04",
    toy_keyboard: "tinytoy_item_note_blue_source_04"
  },
  ui: {
    button: "tinytoy_ui_button_primary",
    sticker: "tinytoy_ui_sticker_01",
    fever: "tinytoy_ui_fever_01",
    combo: "tinytoy_ui_combo_01",
    parts: {
      buttonPrimary: "tinytoy_ui_part_button_primary_red_01",
      buttonPrimaryPressed: "tinytoy_ui_part_button_primary_red_pressed_01",
      buttonSecondary: "tinytoy_ui_part_button_secondary_blue_01",
      buttonSecondaryPressed: "tinytoy_ui_part_button_secondary_blue_pressed_01",
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
      keyboardKey: "tinytoy_ui_part_keyboard_key_01",
      okButton: "tinytoy_ui_part_button_ok_green_01",
      okButtonPressed: "tinytoy_ui_part_button_ok_green_pressed_01",
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
      iconHelpPressed: "tinytoy_ui_part_icon_help_pressed_01",
      paginationDots: "tinytoy_ui_part_pagination_dots_01"
    }
  },
  effects: {
    particleStar: "tinytoy_effect_particle_star_01",
    particleNote: "tinytoy_effect_particle_note_01"
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

// MVP uses lightweight SVG placeholders. Drop generated PNGs at productionFile
// paths and set NEXT_PUBLIC_USE_PRODUCTION_ASSETS=true to prefer them.
const tinyToyFiles: ThemeAssetFile[] = [
  { key: "tinytoy_background_sky_01", category: "background", placeholderFile: "tinytoy_bg_room_sky_01.png", productionFile: "tinytoy_bg_room_sky_01.png", priority: "P2" },
  { key: "tinytoy_background_floor_01", category: "background", placeholderFile: "tinytoy_bg_toy_road_01.png", productionFile: "tinytoy_bg_toy_road_01.png", priority: "P0" },
  { key: "tinytoy_background_toy_block_01", category: "background", placeholderFile: "tinytoy_bg_toy_blocks_01.png", productionFile: "tinytoy_bg_toy_blocks_01.png", priority: "P1" },
  { key: "tinytoy_background_desk_surface_01", category: "background", placeholderFile: "tinytoy_bg_desk_surface_01.png", productionFile: "tinytoy_bg_desk_surface_01.png", priority: "P0" },
  { key: "tinytoy_background_blurred_toys_01", category: "background", placeholderFile: "tinytoy_bg_blurred_toys_01.png", productionFile: "tinytoy_bg_blurred_toys_01.png", priority: "P1" },
  { key: "tinytoy_background_start_sp_tiny_beat_band_01", category: "background", placeholderFile: "tinytoy_bg_start_sp_tiny_beat_band_01.png", productionFile: "tinytoy_bg_start_sp_tiny_beat_band_01.png", priority: "P0" },
  { key: "tinytoy_background_start_pc_tiny_beat_band_01", category: "background", placeholderFile: "tinytoy_bg_start_pc_tiny_beat_band_01.png", productionFile: "tinytoy_bg_start_pc_tiny_beat_band_01.png", priority: "P0" },
  { key: "tinytoy_background_menu_sp_01", category: "background", placeholderFile: "tinytoy_bg_menu_sp_01.png", productionFile: "tinytoy_bg_menu_sp_01.png", priority: "P0" },
  { key: "tinytoy_background_menu_pc_01", category: "background", placeholderFile: "tinytoy_bg_menu_pc_01.png", productionFile: "tinytoy_bg_menu_pc_01.png", priority: "P0" },
  {
    key: "tinytoy_background_game_scroll_sp_03",
    category: "background",
    placeholderFile: "tinytoy_bg_game_scroll_sp_03.png",
    productionFile: "tinytoy_bg_game_scroll_sp_03.png",
    priority: "P0"
  },
  {
    key: "tinytoy_background_fever_neon_space_pc_01",
    category: "background",
    placeholderFile: "tinytoy_bg_fever_neon_space_pc_01.png",
    productionFile: "tinytoy_bg_fever_neon_space_pc_01.png",
    priority: "P0"
  },
  {
    key: "tinytoy_background_fever_toy_room_sp_05",
    category: "background",
    placeholderFile: "tinytoy_bg_fever_toy_room_sp_05.png",
    productionFile: "tinytoy_bg_fever_toy_room_sp_05.png",
    priority: "P0"
  },
  { key: "tinytoy_lane_left_01", category: "lanes", placeholderFile: "tinytoy_lane_left_red_01.png", productionFile: "tinytoy_lane_left_red_01.png", priority: "P1" },
  { key: "tinytoy_lane_center_01", category: "lanes", placeholderFile: "tinytoy_lane_center_yellow_01.png", productionFile: "tinytoy_lane_center_yellow_01.png", priority: "P1" },
  { key: "tinytoy_lane_right_01", category: "lanes", placeholderFile: "tinytoy_lane_right_blue_01.png", productionFile: "tinytoy_lane_right_blue_01.png", priority: "P1" },
  { key: "tinytoy_obstacle_block_01", category: "obstacles", placeholderFile: "tinytoy_obstacle_toy_block_01.png", productionFile: "tinytoy_obstacle_toy_block_01.png", priority: "P0" },
  { key: "tinytoy_obstacle_mini_car_01", category: "obstacles", placeholderFile: "tinytoy_obstacle_mini_car_01.png", productionFile: "tinytoy_obstacle_mini_car_01.png", priority: "P0" },
  { key: "tinytoy_obstacle_traffic_cone_01", category: "obstacles", placeholderFile: "tinytoy_obstacle_traffic_cone_01.png", productionFile: "tinytoy_obstacle_traffic_cone_01.png", priority: "P0" },
  { key: "tinytoy_obstacle_cardboard_box_01", category: "obstacles", placeholderFile: "tinytoy_obstacle_cardboard_box_01.png", productionFile: "tinytoy_obstacle_cardboard_box_01.png", priority: "P1" },
  { key: "tinytoy_obstacle_robot_toy_01", category: "obstacles", placeholderFile: "tinytoy_obstacle_robot_toy_01.png", productionFile: "tinytoy_obstacle_robot_toy_01.png", priority: "P1" },
  { key: "tinytoy_item_star_01", category: "items", placeholderFile: "tinytoy_item_star_runner_01.png", productionFile: "tinytoy_item_star_runner_01.png", priority: "P0" },
  { key: "tinytoy_item_music_note_01", category: "items", placeholderFile: "tinytoy_item_music_note_scooter_01.png", productionFile: "tinytoy_item_music_note_scooter_01.png", priority: "P0" },
  { key: "tinytoy_item_note_red_source_04", category: "items", placeholderFile: "tinytoy_item_note_red_source_04.png", productionFile: "tinytoy_item_note_red_source_04.png", priority: "P0" },
  {
    key: "tinytoy_item_note_yellow_source_04",
    category: "items",
    placeholderFile: "tinytoy_item_note_yellow_source_04.png",
    productionFile: "tinytoy_item_note_yellow_source_04.png",
    priority: "P0"
  },
  { key: "tinytoy_item_note_blue_source_04", category: "items", placeholderFile: "tinytoy_item_note_blue_source_04.png", productionFile: "tinytoy_item_note_blue_source_04.png", priority: "P0" },
  { key: "tinytoy_ui_button_primary", category: "ui", placeholderFile: "tinytoy_ui_primary_button_01.png", productionFile: "tinytoy_ui_primary_button_01.png", priority: "P0" },
  { key: "tinytoy_ui_sticker_01", category: "ui", placeholderFile: "tinytoy_ui_sticker_01.png", productionFile: "tinytoy_ui_sticker_01.png", priority: "P1" },
  { key: "tinytoy_ui_combo_01", category: "ui", placeholderFile: "tinytoy_ui_combo_badge_01.png", productionFile: "tinytoy_ui_combo_badge_01.png", priority: "P0" },
  { key: "tinytoy_ui_fever_01", category: "ui", placeholderFile: "tinytoy_ui_fever_badge_01.png", productionFile: "tinytoy_ui_fever_badge_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_button_primary_red_01", category: "ui", placeholderFile: "parts/tinytoy_ui_button_primary_red_01.png", productionFile: "parts/tinytoy_ui_button_primary_red_01.png", priority: "P0" },
  {
    key: "tinytoy_ui_part_button_primary_red_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_button_primary_red_pressed_01.png",
    productionFile: "parts/tinytoy_ui_button_primary_red_pressed_01.png",
    priority: "P0"
  },
  { key: "tinytoy_ui_part_button_secondary_blue_01", category: "ui", placeholderFile: "parts/tinytoy_ui_button_secondary_blue_01.png", productionFile: "parts/tinytoy_ui_button_secondary_blue_01.png", priority: "P0" },
  {
    key: "tinytoy_ui_part_button_secondary_blue_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_button_secondary_blue_pressed_01.png",
    productionFile: "parts/tinytoy_ui_button_secondary_blue_pressed_01.png",
    priority: "P0"
  },
  { key: "tinytoy_ui_part_song_card_large_01", category: "ui", placeholderFile: "parts/tinytoy_ui_song_card_large_01.png", productionFile: "parts/tinytoy_ui_song_card_large_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_song_card_side_01", category: "ui", placeholderFile: "parts/tinytoy_ui_song_card_side_01.png", productionFile: "parts/tinytoy_ui_song_card_side_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_title_banner_01", category: "ui", placeholderFile: "parts/tinytoy_ui_title_banner_01.png", productionFile: "parts/tinytoy_ui_title_banner_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_title_level_banner_01", category: "ui", placeholderFile: "parts/tinytoy_ui_title_level_banner_01.png", productionFile: "parts/tinytoy_ui_title_level_banner_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_ranking_title_01", category: "ui", placeholderFile: "parts/tinytoy_ui_ranking_title_01.png", productionFile: "parts/tinytoy_ui_ranking_title_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_difficulty_easy_01", category: "ui", placeholderFile: "parts/tinytoy_ui_difficulty_easy_01.png", productionFile: "parts/tinytoy_ui_difficulty_easy_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_difficulty_normal_01", category: "ui", placeholderFile: "parts/tinytoy_ui_difficulty_normal_01.png", productionFile: "parts/tinytoy_ui_difficulty_normal_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_difficulty_hard_01", category: "ui", placeholderFile: "parts/tinytoy_ui_difficulty_hard_01.png", productionFile: "parts/tinytoy_ui_difficulty_hard_01.png", priority: "P0" },
  {
    key: "tinytoy_ui_part_difficulty_easy_selected_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_difficulty_easy_selected_01.png",
    productionFile: "parts/tinytoy_ui_difficulty_easy_selected_01.png",
    priority: "P0"
  },
  {
    key: "tinytoy_ui_part_difficulty_normal_selected_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_difficulty_normal_selected_01.png",
    productionFile: "parts/tinytoy_ui_difficulty_normal_selected_01.png",
    priority: "P0"
  },
  {
    key: "tinytoy_ui_part_difficulty_hard_selected_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_difficulty_hard_selected_01.png",
    productionFile: "parts/tinytoy_ui_difficulty_hard_selected_01.png",
    priority: "P0"
  },
  { key: "tinytoy_ui_part_hud_score_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_score_01.png", productionFile: "parts/tinytoy_ui_hud_score_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_hud_combo_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_combo_01.png", productionFile: "parts/tinytoy_ui_hud_combo_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_hud_miss_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_miss_01.png", productionFile: "parts/tinytoy_ui_hud_miss_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_hud_fever_01", category: "ui", placeholderFile: "parts/tinytoy_ui_hud_fever_01.png", productionFile: "parts/tinytoy_ui_hud_fever_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_ranking_panel_01", category: "ui", placeholderFile: "parts/tinytoy_ui_ranking_panel_01.png", productionFile: "parts/tinytoy_ui_ranking_panel_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_name_input_panel_01", category: "ui", placeholderFile: "parts/tinytoy_ui_name_input_panel_01.png", productionFile: "parts/tinytoy_ui_name_input_panel_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_keyboard_key_01", category: "ui", placeholderFile: "parts/tinytoy_ui_keyboard_key_01.png", productionFile: "parts/tinytoy_ui_keyboard_key_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_button_ok_green_01", category: "ui", placeholderFile: "parts/tinytoy_ui_button_ok_green_01.png", productionFile: "parts/tinytoy_ui_button_ok_green_01.png", priority: "P2" },
  {
    key: "tinytoy_ui_part_button_ok_green_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_button_ok_green_pressed_01.png",
    productionFile: "parts/tinytoy_ui_button_ok_green_pressed_01.png",
    priority: "P2"
  },
  { key: "tinytoy_ui_part_jump_button_left_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_left_01.png", productionFile: "parts/tinytoy_ui_jump_button_left_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_center_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_center_01.png", productionFile: "parts/tinytoy_ui_jump_button_center_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_right_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_right_01.png", productionFile: "parts/tinytoy_ui_jump_button_right_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_left_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_left_pressed_01.png", productionFile: "parts/tinytoy_ui_jump_button_left_pressed_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_center_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_center_pressed_01.png", productionFile: "parts/tinytoy_ui_jump_button_center_pressed_01.png", priority: "P0" },
  { key: "tinytoy_ui_part_jump_button_right_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_jump_button_right_pressed_01.png", productionFile: "parts/tinytoy_ui_jump_button_right_pressed_01.png", priority: "P0" },
  {
    key: "tinytoy_ui_part_arrow_left_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_arrow_left_01.png",
    productionFile: "parts/tinytoy_ui_arrow_left_01.png",
    priority: "P1"
  },
  {
    key: "tinytoy_ui_part_arrow_left_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_arrow_left_pressed_01.png",
    productionFile: "parts/tinytoy_ui_arrow_left_pressed_01.png",
    priority: "P1"
  },
  { key: "tinytoy_ui_part_arrow_right_01", category: "ui", placeholderFile: "parts/tinytoy_ui_arrow_right_01.png", productionFile: "parts/tinytoy_ui_arrow_right_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_arrow_right_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_arrow_right_pressed_01.png", productionFile: "parts/tinytoy_ui_arrow_right_pressed_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_icon_home_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_home_01.png", productionFile: "parts/tinytoy_ui_icon_home_01.png", priority: "P1" },
  { key: "tinytoy_ui_part_icon_retry_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_retry_01.png", productionFile: "parts/tinytoy_ui_icon_retry_01.png", priority: "P1" },
  {
    key: "tinytoy_ui_part_icon_retry_pressed_01",
    category: "ui",
    placeholderFile: "parts/tinytoy_ui_icon_retry_pressed_01.png",
    productionFile: "parts/tinytoy_ui_icon_retry_pressed_01.png",
    priority: "P1"
  },
  { key: "tinytoy_ui_part_icon_trophy_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_trophy_01.png", productionFile: "parts/tinytoy_ui_icon_trophy_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_icon_trophy_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_trophy_pressed_01.png", productionFile: "parts/tinytoy_ui_icon_trophy_pressed_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_icon_gear_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_gear_01.png", productionFile: "parts/tinytoy_ui_icon_gear_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_icon_gear_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_gear_pressed_01.png", productionFile: "parts/tinytoy_ui_icon_gear_pressed_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_icon_help_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_help_01.png", productionFile: "parts/tinytoy_ui_icon_help_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_icon_help_pressed_01", category: "ui", placeholderFile: "parts/tinytoy_ui_icon_help_pressed_01.png", productionFile: "parts/tinytoy_ui_icon_help_pressed_01.png", priority: "P2" },
  { key: "tinytoy_ui_part_pagination_dots_01", category: "ui", placeholderFile: "parts/tinytoy_ui_pagination_dots_01.png", productionFile: "parts/tinytoy_ui_pagination_dots_01.png", priority: "P2" },
  { key: "tinytoy_effect_particle_star_01", category: "effects", placeholderFile: "tinytoy_effect_star_particle_01.png", productionFile: "tinytoy_effect_star_particle_01.png", priority: "P0" },
  { key: "tinytoy_effect_particle_note_01", category: "effects", placeholderFile: "tinytoy_effect_note_particle_01.png", productionFile: "tinytoy_effect_note_particle_01.png", priority: "P0" },
  {
    key: "tinytoy_character_runner_red_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_kigurumi_red_performance_sheet_01.png",
    productionFile: "tinytoy_character_kigurumi_red_performance_sheet_01.png",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_yellow_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_kigurumi_yellow_performance_sheet_01.png",
    productionFile: "tinytoy_character_kigurumi_yellow_performance_sheet_01.png",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_blue_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_kigurumi_blue_performance_sheet_01.png",
    productionFile: "tinytoy_character_kigurumi_blue_performance_sheet_01.png",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_red_fever_iridescent_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_runner_red_fever_iridescent_sheet_01.png",
    productionFile: "tinytoy_character_runner_red_fever_iridescent_sheet_01.png",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01.png",
    productionFile: "tinytoy_character_runner_yellow_fever_iridescent_sheet_01.png",
    frameWidth: 512,
    frameHeight: 512,
    priority: "P0"
  },
  {
    key: "tinytoy_character_runner_blue_fever_iridescent_sheet_01",
    category: "characters",
    placeholderFile: "tinytoy_character_runner_blue_fever_iridescent_sheet_01.png",
    productionFile: "tinytoy_character_runner_blue_fever_iridescent_sheet_01.png",
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
