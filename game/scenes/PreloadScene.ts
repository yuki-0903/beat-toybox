import * as Phaser from "phaser";
import { AUDIO_ASSET_BASE, CHART_ASSET_BASE } from "@/game/config/assets";
import { SONGS } from "@/game/config/songs";
import { gameEvents } from "@/game/systems/GameEvents";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    const { width, height } = this.scale;
    const loadingText = this.add
      .text(width / 2, height / 2, "LOADING", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "24px",
        color: "#f7fbff"
      })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      loadingText.setText(`LOADING ${Math.round(progress * 100)}%`);
    });

    SONGS.forEach((song) => {
      this.load.audio(song.audioKey, [`${AUDIO_ASSET_BASE}/${song.audioFile}`]);
      this.load.json(song.chartKey, `${CHART_ASSET_BASE}/${song.chartFile}`);
    });
    this.load.audio("se_move_beat", [`${AUDIO_ASSET_BASE}/se_move_beat.wav`]);
    this.load.audio("se_item_collect", [`${AUDIO_ASSET_BASE}/se_item_collect.wav`]);
  }

  create() {
    gameEvents.emit("assets:ready");
    this.scene.start("MainScene");
  }
}
