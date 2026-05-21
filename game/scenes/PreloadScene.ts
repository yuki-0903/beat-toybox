import * as Phaser from "phaser";
import { AUDIO_ASSET_BASE, CHART_ASSET_BASE, IMAGE_ASSET_BASE } from "@/game/config/assets";
import { SONGS, type SongDifficulty } from "@/game/config/songs";
import { getThemeAssetEntries } from "@/game/config/themeAssets";
import { gameEvents } from "@/game/systems/GameEvents";

const UI_FONT = '"Fredoka", Arial, Helvetica, sans-serif';
const MENU_BGM_AUDIO_KEY = "bgm_toybox_moon_menu";
const MENU_BGM_AUDIO_FILE = "toybox-moon-menu.mp3";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    gameEvents.emit("assets:progress", { progress: 0 });
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      gameEvents.emit("assets:progress", { progress });
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[BEAT RUNNER] Failed to load asset: ${file.key} (${file.url})`);
    });

    this.load.audio(MENU_BGM_AUDIO_KEY, [`${AUDIO_ASSET_BASE}/${MENU_BGM_AUDIO_FILE}`]);
    const loadedAudioKeys = new Set<string>();
    SONGS.forEach((song) => {
      if (!loadedAudioKeys.has(song.audioKey)) {
        loadedAudioKeys.add(song.audioKey);
        this.load.audio(song.audioKey, [`${AUDIO_ASSET_BASE}/${song.audioFile}`]);
      }
      if (song.chartFiles) {
        (Object.entries(song.chartFiles) as Array<[SongDifficulty, string]>).forEach(([difficulty, chartFile]) => {
          this.load.json(`${song.chartKey}_${difficulty}`, `${CHART_ASSET_BASE}/${chartFile}`);
        });
      } else {
        this.load.json(song.chartKey, `${CHART_ASSET_BASE}/${song.chartFile}`);
      }
      if (song.thumbnailKey && song.thumbnailFile) {
        this.load.image(song.thumbnailKey, `${IMAGE_ASSET_BASE}/${song.thumbnailFile}`);
      }
    });
    getThemeAssetEntries().forEach((asset) => {
      if (asset.path.endsWith(".svg")) {
        this.load.svg(asset.key, asset.path);
        return;
      }

      if (asset.frameWidth && asset.frameHeight) {
        this.load.spritesheet(asset.key, asset.path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        return;
      }

      this.load.image(asset.key, asset.path);
    });
    this.load.audio("se_move_beat", [`${AUDIO_ASSET_BASE}/se_move_beat.wav`]);
    this.load.audio("se_item_collect", [`${AUDIO_ASSET_BASE}/se_item_collect.wav`]);
    this.load.audio("se_character_red", [`${AUDIO_ASSET_BASE}/se_character_red.wav`]);
    this.load.audio("se_character_yellow", [`${AUDIO_ASSET_BASE}/se_character_yellow.wav`]);
    this.load.audio("se_character_blue", [`${AUDIO_ASSET_BASE}/se_character_blue.wav`]);
  }

  async create() {
    await this.waitForUiFont();
    gameEvents.emit("assets:progress", { progress: 1 });
    gameEvents.emit("assets:ready");
    this.scene.start("MainScene");
  }

  private async waitForUiFont() {
    if (typeof document === "undefined" || !document.fonts) {
      return;
    }

    await Promise.race([
      document.fonts.load(`700 24px ${UI_FONT}`),
      new Promise((resolve) => {
        this.time.delayedCall(1200, resolve);
      })
    ]);
  }
}
