import * as Phaser from "phaser";
import { GAME_BALANCE } from "@/game/config/balance";
import { BACKGROUND_COLOR, BASE_GAME_HEIGHT, BASE_GAME_WIDTH } from "@/game/config/gameConfig";
import { SONGS, type SongDefinition } from "@/game/config/songs";
import { gameEvents } from "@/game/systems/GameEvents";
import { InputController } from "@/game/systems/InputController";

interface TrackLayout {
  centerX: number;
  topY: number;
  bottomY: number;
  topWidth: number;
  bottomWidth: number;
}

interface Obstacle {
  lane: number;
  hitTime: number;
  groupId: string;
  blockedLanes: number[];
  judged: boolean;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  shine: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Ellipse;
}

interface CollectibleItem {
  lane: number;
  hitTime: number;
  score: number;
  collected: boolean;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Star;
  glow: Phaser.GameObjects.Ellipse;
}

interface ScheduledObstacle {
  time: number;
  lane: number;
  groupId: string;
  blockedLanes: number[];
  energy: number;
}

interface ChartObstacle {
  time: number;
  lane: number;
  type: string;
  pattern: string;
  energy: number;
  soundOnDodge: string;
}

interface ChartItem {
  time: number;
  lane: number;
  type: string;
  sound: string;
  score: number;
}

interface BeatmapChart {
  duration: number;
  bpm: number;
  approachTime: number;
  obstacles: ChartObstacle[];
  items?: ChartItem[];
}

type DifficultyId = "easy" | "normal" | "hard";
type MenuStep = "song" | "difficulty";
type DebugAction = "densityDown" | "densityUp" | "speedDown" | "speedUp";

interface DifficultyButton {
  id: DifficultyId;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface SongButton {
  song: SongDefinition;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface DebugButton {
  action: DebugAction;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

const DIFFICULTY_SETTINGS: Record<
  DifficultyId,
  {
    label: string;
    intervalSeconds: number;
    scoreMultiplier: number;
    authoredStep: number;
  }
> = {
  easy: {
    label: "EASY",
    intervalSeconds: 0.92,
    scoreMultiplier: 1,
    authoredStep: 4
  },
  normal: {
    label: "NORMAL",
    intervalSeconds: 0.72,
    scoreMultiplier: 1.15,
    authoredStep: 3
  },
  hard: {
    label: "HARD",
    intervalSeconds: 0.54,
    scoreMultiplier: 1.35,
    authoredStep: 2
  }
};

export class MainScene extends Phaser.Scene {
  private inputController?: InputController;
  private background?: Phaser.GameObjects.Rectangle;
  private trackGraphics?: Phaser.GameObjects.Graphics;
  private player?: Phaser.GameObjects.Container;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private playerBody?: Phaser.GameObjects.Ellipse;
  private playerFace?: Phaser.GameObjects.Ellipse;
  private titleLabel?: Phaser.GameObjects.Text;
  private sizeLabel?: Phaser.GameObjects.Text;
  private laneLabel?: Phaser.GameObjects.Text;
  private scoreLabel?: Phaser.GameObjects.Text;
  private comboLabel?: Phaser.GameObjects.Text;
  private missLabel?: Phaser.GameObjects.Text;
  private feverLabel?: Phaser.GameObjects.Text;
  private feedbackLabel?: Phaser.GameObjects.Text;
  private startLabel?: Phaser.GameObjects.Text;
  private resultLabel?: Phaser.GameObjects.Text;
  private debugDensityLabel?: Phaser.GameObjects.Text;
  private debugSpeedLabel?: Phaser.GameObjects.Text;
  private songButtons: SongButton[] = [];
  private difficultyButtons: DifficultyButton[] = [];
  private debugButtons: DebugButton[] = [];
  private bgm?: Phaser.Sound.BaseSound;
  private moveSe?: Phaser.Sound.BaseSound;
  private itemSe?: Phaser.Sound.BaseSound;
  private chart?: BeatmapChart;
  private chartObstacles: ScheduledObstacle[] = [];
  private chartItems: ChartItem[] = [];
  private obstacles: Obstacle[] = [];
  private items: CollectibleItem[] = [];
  private judgedGroupIds = new Set<string>();
  private startTime = 0;
  private nextChartIndex = 0;
  private nextItemIndex = 0;
  private score = 0;
  private avoidCount = 0;
  private combo = 0;
  private maxCombo = 0;
  private missCount = 0;
  private feverActive = false;
  private gameStarted = false;
  private gameEnded = false;
  private menuStep: MenuStep = "song";
  private selectedSongIndex = 0;
  private selectedDifficulty: DifficultyId = "normal";
  private debugDensityLevel = 0;
  private debugSpeedLevel = 0;
  private lastMissEffectAt = 0;
  private lastLayoutRefreshAt = 0;
  private currentLane = 1;
  private visualLane = 1;
  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!this.gameStarted) {
      if (this.gameEnded) {
        this.showSongSelect();
        return;
      }

      const pointerPosition = this.getPointerWorldPoint(pointer);
      if (this.menuStep === "song" && this.trySelectSong(pointerPosition.x, pointerPosition.y)) {
        return;
      }

      if (this.menuStep === "difficulty" && this.tryPressDebugButton(pointerPosition.x, pointerPosition.y)) {
        return;
      }

      if (this.menuStep === "difficulty" && this.trySelectDifficulty(pointerPosition.x, pointerPosition.y)) {
        return;
      }

      return;
    }

    const pointerPosition = this.getPointerWorldPoint(pointer);
    this.moveLane(pointerPosition.x < this.scale.width / 2 ? -1 : 1);
  };
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      if (!this.gameStarted) {
        if (this.gameEnded) {
          this.showSongSelect();
        } else if (this.menuStep === "song") {
          this.selectSongByOffset(-1);
        }
        return;
      }
      this.moveLane(-1);
      return;
    }

    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      if (!this.gameStarted) {
        if (this.gameEnded) {
          this.showSongSelect();
        } else if (this.menuStep === "song") {
          this.selectSongByOffset(1);
        }
        return;
      }
      this.moveLane(1);
      return;
    }

    if (
      !this.gameStarted &&
      !this.gameEnded &&
      this.menuStep === "difficulty" &&
      (event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3")
    ) {
      event.preventDefault();
      const nextDifficulty = event.code === "Digit1" ? "easy" : event.code === "Digit2" ? "normal" : "hard";
      this.selectDifficulty(nextDifficulty);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "song" && (event.code === "KeyQ" || event.code === "KeyE")) {
      event.preventDefault();
      this.selectSongByOffset(event.code === "KeyQ" ? -1 : 1);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "difficulty") {
      if (event.code === "BracketLeft" || event.code === "BracketRight") {
        event.preventDefault();
        this.adjustDebugTuning(event.code === "BracketLeft" ? "densityDown" : "densityUp");
        return;
      }

      if (event.code === "Minus" || event.code === "Equal") {
        event.preventDefault();
        this.adjustDebugTuning(event.code === "Minus" ? "speedDown" : "speedUp");
      }
    }
  };

  constructor() {
    super("MainScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.inputController = new InputController(this);
    this.createPrototypeView();
    this.createSelectedBgm();
    this.moveSe = this.sound.add("se_move_beat", { volume: 0.68 });
    this.itemSe = this.sound.add("se_item_collect", { volume: 0.76 });
    this.loadChart();
    this.layout();
    this.input.keyboard?.on("keydown", this.handleKeyDown);
    this.input.on("pointerdown", this.handlePointerDown);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyScene, this);
    gameEvents.emit("scene:ready", { sceneKey: this.scene.key });
  }

  update() {
    this.inputController?.update();
    if (!this.gameStarted) {
      return;
    }

    if (this.updateSongLoop()) {
      return;
    }
    this.updateChartSpawns();
    this.updateItemSpawns();
    this.updateObstacles();
    this.updateItems();
    if (this.feverActive) {
      this.drawTrack(this.getTrackLayout());
    }
  }

  private createPrototypeView() {
    this.background = this.add.rectangle(0, 0, 1, 1, 0x05070f).setOrigin(0);
    this.trackGraphics = this.add.graphics();

    this.playerShadow = this.add.ellipse(0, 18, 54, 16, 0x05070f, 0.45);
    this.playerBody = this.add.ellipse(0, 0, 44, 54, 0xffd15c);
    this.playerFace = this.add.ellipse(0, -8, 24, 20, 0xfff4d1);
    this.player = this.add.container(0, 0, [this.playerShadow, this.playerBody, this.playerFace]).setDepth(160);

    this.titleLabel = this.add
      .text(0, 0, "BEAT RUNNER", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#f7fbff",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.laneLabel = this.add
      .text(0, 0, "PROTOTYPE", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "700",
        color: "#ffdc73",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.sizeLabel = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#8fd7ff",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.comboLabel = this.add
      .text(0, 0, "COMBO 0", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#f7fbff",
        align: "left"
      })
      .setOrigin(0, 0.5)
      .setDepth(300);

    this.scoreLabel = this.add
      .text(0, 0, "SCORE 00000", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#ffdc73",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.missLabel = this.add
      .text(0, 0, "MISS 0", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#ff8fa3",
        align: "right"
      })
      .setOrigin(1, 0.5)
      .setDepth(300);

    this.feverLabel = this.add
      .text(0, 0, "FEVER", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#ffdc73",
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(300);

    this.feedbackLabel = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#ffdc73",
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(300);

    this.startLabel = this.add
      .text(0, 0, "START", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#f7fbff",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(320);

    this.resultLabel = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#f7fbff",
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330)
      .setLineSpacing(8);

    this.debugDensityLabel = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#ffdc73",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(316);

    this.debugSpeedLabel = this.add
      .text(0, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: "900",
        color: "#64f5c8",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(316);

    this.songButtons = SONGS.map((song) => {
      const background = this.add.rectangle(0, 0, 1, 1, 0x102742, 0.95).setDepth(315);
      const label = this.add
        .text(0, 0, song.shortTitle, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontStyle: "900",
          color: "#f7fbff",
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);

      background.setStrokeStyle(2, 0x8fd7ff, 0.65);

      return { song, background, label };
    });

    this.difficultyButtons = (["easy", "normal", "hard"] as DifficultyId[]).map((id) => {
      const background = this.add.rectangle(0, 0, 1, 1, 0x1a294a, 0.95).setDepth(315);
      const label = this.add
        .text(0, 0, DIFFICULTY_SETTINGS[id].label, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontStyle: "900",
          color: "#f7fbff",
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);

      background.setStrokeStyle(2, 0x8fd7ff, 0.65);

      return { id, background, label };
    });

    this.debugButtons = (["densityDown", "densityUp", "speedDown", "speedUp"] as DebugAction[]).map((action) => {
      const background = this.add.rectangle(0, 0, 1, 1, 0x11182d, 0.95).setDepth(315);
      const label = this.add
        .text(0, 0, action.endsWith("Down") ? "-" : "+", {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontStyle: "900",
          color: "#f7fbff",
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);

      background.setStrokeStyle(2, 0x8fd7ff, 0.65);

      return { action, background, label };
    });
  }

  private layout() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const track = this.getTrackLayout();

    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    this.background?.setPosition(0, 0).setSize(width, height);
    this.drawTrack(track);
    this.layoutPlayer(track);
    this.layoutObstacles(track);
    this.layoutItems(track);

    this.titleLabel
      ?.setPosition(width / 2, 32 * screenScale)
      .setFontSize(Math.round(32 * screenScale));

    this.laneLabel
      ?.setPosition(width / 2, 88 * screenScale)
      .setFontSize(Math.round(16 * screenScale))
      .setText(`${this.selectedSong.shortTitle} / ${DIFFICULTY_SETTINGS[this.selectedDifficulty].label}`);

    this.comboLabel
      ?.setPosition(18 * screenScale, 28 * screenScale)
      .setFontSize(Math.round(22 * screenScale))
      .setText(`COMBO ${this.combo}`);

    this.scoreLabel
      ?.setPosition(width / 2, 60 * screenScale)
      .setFontSize(Math.round(20 * screenScale))
      .setText(`SCORE ${this.score.toString().padStart(5, "0")}`);

    this.missLabel
      ?.setPosition(width - 18 * screenScale, 28 * screenScale)
      .setFontSize(Math.round(22 * screenScale))
      .setText(`MISS ${this.missCount}`);

    this.feverLabel
      ?.setPosition(width / 2, 98 * screenScale)
      .setFontSize(Math.round(22 * screenScale));

    this.feedbackLabel
      ?.setPosition(width / 2, height * (this.isPortrait ? 0.28 : 0.36))
      .setFontSize(Math.round(24 * screenScale));

    this.startLabel
      ?.setPosition(width / 2, height * 0.43)
      .setFontSize(Math.round(30 * screenScale))
      .setText(this.menuStep === "song" ? "SELECT SONG" : "SELECT LEVEL")
      .setAlpha(!this.gameStarted && !this.gameEnded ? 1 : 0);

    this.resultLabel
      ?.setPosition(width / 2, height * 0.46)
      .setFontSize(Math.round(24 * screenScale));

    this.layoutSongButtons();
    this.layoutDifficultyButtons();
    this.layoutDebugButtons();

    this.sizeLabel
      ?.setPosition(width / 2, height - 24 * screenScale)
      .setFontSize(Math.round(18 * screenScale))
      .setText(`${width} x ${height}`);
  }

  private layoutDifficultyButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const totalWidth = Math.min(width * 0.86, 360 * screenScale);
    const gap = 8 * screenScale;
    const buttonWidth = (totalWidth - gap * 2) / 3;
    const buttonHeight = 48 * screenScale;
    const centerY = height * 0.59;
    const startX = width / 2 - totalWidth / 2 + buttonWidth / 2;
    const isSelectable = !this.gameStarted && !this.gameEnded && this.menuStep === "difficulty";

    this.difficultyButtons.forEach((button, index) => {
      const selected = button.id === this.selectedDifficulty;
      const x = startX + index * (buttonWidth + gap);
      const fillColor = selected ? 0xffdc73 : 0x1a294a;
      const strokeColor = selected ? 0xfff4d1 : 0x8fd7ff;
      const textColor = selected ? "#101525" : "#f7fbff";

      button.background
        .setPosition(x, centerY)
        .setSize(buttonWidth, buttonHeight)
        .setFillStyle(fillColor, selected ? 1 : 0.92)
        .setStrokeStyle(2 * screenScale, strokeColor, selected ? 0.95 : 0.65)
        .setAlpha(isSelectable ? 1 : 0);

      button.label
        .setPosition(x, centerY)
        .setFontSize(Math.round(Phaser.Math.Clamp(17 * screenScale, 14, 24)))
        .setColor(textColor)
        .setAlpha(isSelectable ? 1 : 0);
    });
  }

  private layoutSongButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const columns = this.isPortrait ? 2 : 3;
    const totalWidth = Math.min(width * (this.isPortrait ? 0.86 : 0.72), 560 * screenScale);
    const gap = 10 * screenScale;
    const buttonWidth = (totalWidth - gap * (columns - 1)) / columns;
    const buttonHeight = 48 * screenScale;
    const startY = height * (this.isPortrait ? 0.52 : 0.55);
    const startX = width / 2 - totalWidth / 2 + buttonWidth / 2;
    const isSelectable = !this.gameStarted && !this.gameEnded && this.menuStep === "song";

    this.songButtons.forEach((button, index) => {
      const selected = index === this.selectedSongIndex;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * (buttonWidth + gap);
      const y = startY + row * (buttonHeight + gap);
      const fillColor = selected ? 0x64f5c8 : 0x102742;
      const strokeColor = selected ? 0xf7fbff : 0x8fd7ff;
      const textColor = selected ? "#101525" : "#f7fbff";

      button.background
        .setPosition(x, y)
        .setSize(buttonWidth, buttonHeight)
        .setFillStyle(fillColor, selected ? 1 : 0.92)
        .setStrokeStyle(2 * screenScale, strokeColor, selected ? 0.95 : 0.65)
        .setAlpha(isSelectable ? 1 : 0);

      button.label
        .setPosition(x, y)
        .setFontSize(Math.round(Phaser.Math.Clamp(15 * screenScale, 12, 22)))
        .setColor(textColor)
        .setAlpha(isSelectable ? 1 : 0);
    });
  }

  private layoutDebugButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const isVisible = !this.gameStarted && !this.gameEnded && this.menuStep === "difficulty";
    const buttonSize = 42 * screenScale;
    const labelWidth = Math.min(width * 0.38, 190 * screenScale);
    const gap = 8 * screenScale;
    const centerX = width / 2;
    const densityY = height * (this.isPortrait ? 0.68 : 0.66);
    const speedY = densityY + 46 * screenScale;
    const textSize = Math.round(Phaser.Math.Clamp(15 * screenScale, 12, 22));
    const rows: Array<{ actions: [DebugAction, DebugAction]; label: string; y: number }> = [
      {
        actions: ["densityDown", "densityUp"],
        label: `DENSITY ${Math.round(this.debugDensityFactor * 100)}%`,
        y: densityY
      },
      {
        actions: ["speedDown", "speedUp"],
        label: `SPEED ${Math.round(this.debugSpeedFactor * 100)}%`,
        y: speedY
      }
    ];

    rows.forEach((row) => {
      const [downAction, upAction] = row.actions;
      const downButton = this.debugButtons.find((button) => button.action === downAction);
      const upButton = this.debugButtons.find((button) => button.action === upAction);
      const downX = centerX - labelWidth / 2 - buttonSize / 2 - gap;
      const upX = centerX + labelWidth / 2 + buttonSize / 2 + gap;

      this.layoutDebugButton(downButton, downX, row.y, buttonSize, textSize, isVisible, "-");
      this.layoutDebugButton(upButton, upX, row.y, buttonSize, textSize, isVisible, "+");

      if (!downButton || !upButton) {
        return;
      }

      downButton.label.setText("-");
      upButton.label.setText("+");
      const rowLabel = row.actions[0] === "densityDown" ? this.debugDensityLabel : this.debugSpeedLabel;
      rowLabel
        ?.setPosition(centerX, row.y)
        .setFontSize(textSize)
        .setText(row.label)
        .setAlpha(isVisible ? 1 : 0);
    });
  }

  private layoutDebugButton(
    button: DebugButton | undefined,
    x: number,
    y: number,
    size: number,
    textSize: number,
    isVisible: boolean,
    text: string
  ) {
    if (!button) {
      return;
    }

    button.background
      .setPosition(x, y)
      .setSize(size, size)
      .setFillStyle(0x11182d, 0.95)
      .setStrokeStyle(2 * this.screenScale, 0x8fd7ff, 0.75)
      .setAlpha(isVisible ? 1 : 0);
    button.label
      .setPosition(x, y)
      .setText(text)
      .setFontSize(textSize)
      .setAlpha(isVisible ? 1 : 0);
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.layout();
  }

  private trySelectDifficulty(x: number, y: number) {
    const targetButton = this.difficultyButtons.find((button) => button.background.getBounds().contains(x, y));
    if (!targetButton) {
      return false;
    }

    this.selectDifficulty(targetButton.id);
    return true;
  }

  private tryPressDebugButton(x: number, y: number) {
    const targetButton = this.debugButtons.find((button) => button.background.getBounds().contains(x, y));
    if (!targetButton) {
      return false;
    }

    this.adjustDebugTuning(targetButton.action);
    return true;
  }

  private adjustDebugTuning(action: DebugAction) {
    if (action === "densityDown" || action === "densityUp") {
      const delta = action === "densityDown" ? -1 : 1;
      this.debugDensityLevel = Phaser.Math.Clamp(this.debugDensityLevel + delta, -4, 8);
      this.rebuildDifficultyChart();
      this.popFeedback(`DENSITY ${Math.round(this.debugDensityFactor * 100)}%`, "#ffdc73");
      this.layout();
      return;
    }

    const delta = action === "speedDown" ? -1 : 1;
    this.debugSpeedLevel = Phaser.Math.Clamp(this.debugSpeedLevel + delta, -4, 8);
    this.popFeedback(`SPEED ${Math.round(this.debugSpeedFactor * 100)}%`, "#64f5c8");
    this.layout();
  }

  private selectDifficulty(difficulty: DifficultyId) {
    this.selectedDifficulty = difficulty;
    this.rebuildDifficultyChart();
    this.startRun();
  }

  private trySelectSong(x: number, y: number) {
    const targetIndex = this.songButtons.findIndex((button) => button.background.getBounds().contains(x, y));
    if (targetIndex < 0) {
      return false;
    }

    this.selectSong(targetIndex);
    return true;
  }

  private selectSongByOffset(offset: number) {
    this.selectSong((this.selectedSongIndex + offset + SONGS.length) % SONGS.length);
  }

  private selectSong(index: number) {
    const changedSong = this.selectedSongIndex !== index;

    this.selectedSongIndex = index;
    if (changedSong) {
      this.createSelectedBgm();
      this.loadChart();
    }
    this.showDifficultySelect();
    this.popFeedback(this.selectedSong.shortTitle, "#64f5c8");
    this.layout();
  }

  private showDifficultySelect() {
    this.gameEnded = false;
    this.menuStep = "difficulty";
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
  }

  private showSongSelect() {
    this.gameEnded = false;
    this.menuStep = "song";
    this.score = 0;
    this.avoidCount = 0;
    this.combo = 0;
    this.missCount = 0;
    this.maxCombo = 0;
    this.lastMissEffectAt = 0;
    this.lastLayoutRefreshAt = 0;
    this.setFeverActive(false);
    this.clearObstacles();
    this.clearItems();
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
  }

  private createSelectedBgm() {
    this.bgm?.stop();
    this.bgm?.destroy();
    this.bgm = this.sound.add(this.selectedSong.audioKey, {
      loop: false,
      volume: 0.55
    });
  }

  private get screenScale() {
    return Phaser.Math.Clamp(
      Math.min(this.scale.width / BASE_GAME_WIDTH, this.scale.height / BASE_GAME_HEIGHT),
      0.62,
      1.45
    );
  }

  private get isPortrait() {
    return this.scale.height > this.scale.width;
  }

  private getTrackLayout(): TrackLayout {
    const { width, height } = this.scale;
    const mode = this.isPortrait ? "portrait" : "landscape";

    return {
      centerX: width / 2,
      topY: height * GAME_BALANCE.trackTopYRatio[mode],
      bottomY: height * GAME_BALANCE.trackBottomYRatio[mode],
      topWidth: width * GAME_BALANCE.trackTopWidthRatio[mode],
      bottomWidth: width * GAME_BALANCE.trackBottomWidthRatio[mode]
    };
  }

  private drawTrack(track: TrackLayout) {
    const graphics = this.trackGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    this.drawBackdrop(graphics, track);
    this.drawLaneSurfaces(graphics, track);
    this.drawDepthLines(graphics, track);
    this.drawLaneDividers(graphics, track);
  }

  private drawBackdrop(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const { width, height } = this.scale;
    const horizonGlowHeight = Math.max(120 * this.screenScale, height * 0.2);
    const pulse = this.feverPulse;

    graphics.fillStyle(this.feverActive ? 0x101025 : 0x0a1020, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(this.feverActive ? 0x55306f : 0x102742, this.feverActive ? 0.72 + pulse * 0.18 : 0.7);
    graphics.fillEllipse(
      track.centerX,
      track.topY,
      track.topWidth * (this.feverActive ? 1.95 + pulse * 0.16 : 1.65),
      horizonGlowHeight
    );

    graphics.fillStyle(this.feverActive ? 0x160c24 : 0x07111c, 1);
    graphics.fillRect(0, track.bottomY, width, height - track.bottomY);
  }

  private drawLaneSurfaces(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    for (let lane = 0; lane < GAME_BALANCE.laneCount; lane += 1) {
      const topLeft = this.getLaneBoundaryPoint(track, lane, 0);
      const topRight = this.getLaneBoundaryPoint(track, lane + 1, 0);
      const bottomRight = this.getLaneBoundaryPoint(track, lane + 1, 1);
      const bottomLeft = this.getLaneBoundaryPoint(track, lane, 1);
      const color = this.feverActive ? (lane === 1 ? 0x49336f : 0x33245d) : lane === 1 ? 0x24345a : 0x1a294a;

      graphics.fillStyle(color, 0.96);
      graphics.fillPoints([topLeft, topRight, bottomRight, bottomLeft], true);
    }
  }

  private drawDepthLines(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    for (let index = 1; index <= 9; index += 1) {
      const z = index / 10;
      const left = this.getLaneBoundaryPoint(track, 0, z);
      const right = this.getLaneBoundaryPoint(track, GAME_BALANCE.laneCount, z);
      const lineWidth = Phaser.Math.Linear(1, 5, z) * this.screenScale;

      graphics.lineStyle(
        lineWidth,
        this.feverActive ? 0xffdc73 : 0x8fd7ff,
        Phaser.Math.Linear(this.feverActive ? 0.22 : 0.12, this.feverActive ? 0.72 : 0.5, z)
      );
      graphics.beginPath();
      graphics.moveTo(left.x, left.y);
      graphics.lineTo(right.x, right.y);
      graphics.strokePath();
    }
  }

  private drawLaneDividers(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    for (let boundary = 0; boundary <= GAME_BALANCE.laneCount; boundary += 1) {
      const top = this.getLaneBoundaryPoint(track, boundary, 0);
      const bottom = this.getLaneBoundaryPoint(track, boundary, 1);
      const isEdge = boundary === 0 || boundary === GAME_BALANCE.laneCount;

      graphics.lineStyle(
        (isEdge ? 4 : 2) * this.screenScale,
        this.feverActive ? 0xfff1a8 : 0xf7fbff,
        isEdge ? 0.9 : 0.45
      );
      graphics.beginPath();
      graphics.moveTo(top.x, top.y);
      graphics.lineTo(bottom.x, bottom.y);
      graphics.strokePath();
    }
  }

  private layoutPlayer(track: TrackLayout) {
    const playerPoint = this.getLaneCenterPoint(track, this.visualLane, GAME_BALANCE.playerZ);
    const playerScale = Phaser.Math.Linear(0.45, 1.25, GAME_BALANCE.playerZ) * this.screenScale;

    this.player?.setPosition(playerPoint.x, playerPoint.y).setScale(playerScale);
  }

  private startRun() {
    if (this.gameStarted) {
      return;
    }

    this.gameStarted = true;
    this.gameEnded = false;
    this.rebuildDifficultyChart();
    this.startTime = this.time.now;
    this.nextChartIndex = 0;
    this.nextItemIndex = 0;
    this.judgedGroupIds.clear();
    this.score = 0;
    this.avoidCount = 0;
    this.combo = 0;
    this.missCount = 0;
    this.maxCombo = 0;
    this.lastMissEffectAt = 0;
    this.lastLayoutRefreshAt = 0;
    this.setFeverActive(false);
    this.clearObstacles();
    this.clearItems();

    this.bgm?.stop();
    this.bgm?.play();

    const result = this.resultLabel;
    if (result) {
      this.tweens.killTweensOf(result);
      result.setAlpha(0);
    }

    const label = this.startLabel;
    if (label) {
      this.tweens.killTweensOf(label);
      this.tweens.add({
        targets: label,
        alpha: 0,
        scale: 1.2,
        duration: 220,
        ease: "Sine.Out"
      });
    }

    this.popFeedback("GO", "#ffdc73");
    this.layout();
  }

  private loadChart() {
    const rawChart = this.cache.json.get(this.selectedSong.chartKey) as BeatmapChart | undefined;
    if (!rawChart) {
      return;
    }

    this.chart = rawChart;
    this.chartItems = (rawChart.items ?? [])
      .filter((item) => item.lane >= 0 && item.lane < GAME_BALANCE.laneCount)
      .sort((a, b) => a.time - b.time);
    this.rebuildDifficultyChart();
  }

  private rebuildDifficultyChart() {
    const chart = this.chart;
    if (!chart) {
      return;
    }

    if (this.selectedSong.chartMode === "authored") {
      this.chartObstacles = this.createAuthoredScheduledChart(this.createAuthoredDifficultyObstacles(chart));
      return;
    }

    this.chartObstacles = this.createGuidedChart(this.createSteadyDifficultyObstacles(chart));
  }

  private createAuthoredDifficultyObstacles(chart: BeatmapChart) {
    const baseRatio = 1 / DIFFICULTY_SETTINGS[this.selectedDifficulty].authoredStep;
    const targetRatio = Phaser.Math.Clamp(baseRatio * this.debugDensityFactor, 0.08, 0.75);
    let accumulator = 0;

    return chart.obstacles
      .filter((obstacle) => obstacle.lane >= 0 && obstacle.lane < GAME_BALANCE.laneCount)
      .sort((a, b) => a.time - b.time)
      .filter(() => {
        accumulator += targetRatio;
        if (accumulator < 1) {
          return false;
        }

        accumulator -= 1;
        return true;
      });
  }

  private createAuthoredScheduledChart(sourceObstacles: ChartObstacle[]) {
    return sourceObstacles.map((obstacle, index) => {
      const timeKey = obstacle.time.toFixed(3);

      return {
        time: obstacle.time,
        lane: obstacle.lane,
        groupId: `authored-${timeKey}-${index}`,
        blockedLanes: [obstacle.lane],
        energy: obstacle.energy
      };
    });
  }

  private createSteadyDifficultyObstacles(chart: BeatmapChart) {
    const difficulty = DIFFICULTY_SETTINGS[this.selectedDifficulty];
    const intervalSeconds = difficulty.intervalSeconds / this.debugDensityFactor;
    const startTime = 2.25;
    const endTime = Math.max(startTime, chart.duration - 1.2);
    const laneOrder = [1, 2, 0, 2, 1, 0];
    const obstacles: ChartObstacle[] = [];

    for (let time = startTime, index = 0; time <= endTime + 0.001; time += intervalSeconds, index += 1) {
      obstacles.push({
        time: Number(time.toFixed(3)),
        lane: laneOrder[index % laneOrder.length],
        type: "block",
        pattern: this.selectedDifficulty,
        energy: Number((0.48 + (index % 4) * 0.08).toFixed(3)),
        soundOnDodge: "wood_tap"
      });
    }

    return obstacles;
  }

  private createGuidedChart(sourceObstacles: ChartObstacle[]) {
    const grouped = new Map<string, ChartObstacle[]>();

    sourceObstacles.forEach((obstacle) => {
      const key = obstacle.time.toFixed(3);
      const group = grouped.get(key) ?? [];
      group.push(obstacle);
      grouped.set(key, group);
    });

    let previousSafeLane = this.currentLane;

    return Array.from(grouped.entries()).flatMap(([timeKey, group], groupIndex) => {
      const time = Number(timeKey);
      const safeLane = this.getGuidedSafeLane(group, groupIndex, previousSafeLane);
      const blockedLanes = Array.from({ length: GAME_BALANCE.laneCount }, (_, lane) => lane).filter(
        (lane) => lane !== safeLane
      );
      const groupId = `gate-${timeKey}-${groupIndex}`;
      const energy = Math.max(...group.map((obstacle) => obstacle.energy));

      previousSafeLane = safeLane;

      return blockedLanes.map((lane) => ({
        time,
        lane,
        groupId,
        blockedLanes,
        energy
      }));
    });
  }

  private getGuidedSafeLane(_group: ChartObstacle[], groupIndex: number, previousSafeLane: number) {
    const laneOrder = [0, 2, 1, 2, 0, 1];
    const preferredLane = laneOrder[groupIndex % laneOrder.length];

    if (preferredLane !== previousSafeLane) {
      return preferredLane;
    }

    return laneOrder[(groupIndex + 1) % laneOrder.length];
  }

  private updateChartSpawns() {
    const chart = this.chart;
    if (!chart) {
      return;
    }

    const songTime = this.songTimeSeconds;

    while (this.nextChartIndex < this.chartObstacles.length) {
      const chartObstacle = this.chartObstacles[this.nextChartIndex];
      const spawnTime = chartObstacle.time - this.chartApproachTime;

      if (songTime < spawnTime) {
        break;
      }

      this.spawnObstacle(chartObstacle);
      this.nextChartIndex += 1;
    }
  }

  private updateItemSpawns() {
    const chart = this.chart;
    if (!chart) {
      return;
    }

    const songTime = this.songTimeSeconds;

    while (this.nextItemIndex < this.chartItems.length) {
      const chartItem = this.chartItems[this.nextItemIndex];
      const spawnTime = chartItem.time - this.chartApproachTime;

      if (songTime < spawnTime) {
        break;
      }

      this.spawnItem(chartItem);
      this.nextItemIndex += 1;
    }
  }

  private updateSongLoop() {
    const duration = this.chart?.duration;
    if (!duration || this.songTimeSeconds < duration) {
      return false;
    }

    this.finishRun();
    return true;
  }

  private finishRun() {
    if (this.gameEnded) {
      return;
    }

    this.gameStarted = false;
    this.gameEnded = true;
    this.bgm?.stop();
    this.clearObstacles();
    this.clearItems();
    this.setFeverActive(false);
    this.popResult();
    this.layout();
  }

  private spawnObstacle(chartObstacle: ScheduledObstacle) {
    const shadow = this.add.ellipse(0, 18, 54, 16, 0x030712, 0.45);
    const body = this.add.rectangle(0, 0, GAME_BALANCE.obstacleBaseWidth, GAME_BALANCE.obstacleBaseHeight, 0xff5c83, 1);
    const shine = this.add.rectangle(-10, -8, GAME_BALANCE.obstacleBaseWidth * 0.42, 6, 0xfff1a8, 0.9);
    const container = this.add.container(0, 0, [shadow, body, shine]);
    const obstacle: Obstacle = {
      lane: chartObstacle.lane,
      hitTime: chartObstacle.time,
      groupId: chartObstacle.groupId,
      blockedLanes: chartObstacle.blockedLanes,
      judged: false,
      container,
      body,
      shine,
      shadow
    };

    body.setStrokeStyle(2, 0xffd0df, 0.8);
    this.obstacles.push(obstacle);
    this.layoutObstacle(obstacle, this.getTrackLayout());
  }

  private spawnItem(chartItem: ChartItem) {
    const glow = this.add.ellipse(0, 0, 42, 24, 0xffdc73, 0.28);
    const body = this.add.star(0, 0, 5, 8, 18, 0xffdc73, 1);
    const container = this.add.container(0, 0, [glow, body]);
    const item: CollectibleItem = {
      lane: chartItem.lane,
      hitTime: chartItem.time,
      score: chartItem.score,
      collected: false,
      container,
      body,
      glow
    };

    body.setStrokeStyle(2, 0xfff4d1, 0.95);
    this.items.push(item);
    this.layoutItem(item, this.getTrackLayout());
  }

  private updateObstacles() {
    const track = this.getTrackLayout();

    this.obstacles = this.obstacles.filter((obstacle) => {
      const z = this.getObstacleZ(obstacle);
      this.judgeObstacle(obstacle, z);

      if (z >= GAME_BALANCE.obstacleDespawnZ) {
        obstacle.container.destroy(true);
        return false;
      }

      this.layoutObstacle(obstacle, track);
      return true;
    });
  }

  private updateItems() {
    const track = this.getTrackLayout();

    this.items = this.items.filter((item) => {
      const z = this.getItemZ(item);
      this.judgeItem(item, z);

      if (z >= GAME_BALANCE.obstacleDespawnZ || item.collected) {
        item.container.destroy(true);
        return false;
      }

      this.layoutItem(item, track);
      return true;
    });
  }

  private layoutObstacles(track: TrackLayout) {
    this.obstacles.forEach((obstacle) => this.layoutObstacle(obstacle, track));
  }

  private layoutItems(track: TrackLayout) {
    this.items.forEach((item) => this.layoutItem(item, track));
  }

  private layoutObstacle(obstacle: Obstacle, track: TrackLayout) {
    const z = this.getObstacleZ(obstacle);
    const point = this.getLaneCenterPoint(track, obstacle.lane, z);
    const scale = Phaser.Math.Linear(0.24, 1.22, z) * this.screenScale;

    obstacle.container.setPosition(point.x, point.y).setScale(scale).setDepth(Math.round(z * 100));
    obstacle.body.setSize(GAME_BALANCE.obstacleBaseWidth, GAME_BALANCE.obstacleBaseHeight);
    obstacle.shine.setSize(GAME_BALANCE.obstacleBaseWidth * 0.42, 6);
    obstacle.shadow.setSize(GAME_BALANCE.obstacleBaseWidth * 0.9, 14);
  }

  private layoutItem(item: CollectibleItem, track: TrackLayout) {
    const z = this.getItemZ(item);
    const point = this.getLaneCenterPoint(track, item.lane, z);
    const scale = Phaser.Math.Linear(0.28, 1.18, z) * this.screenScale;
    const pulse = 1 + Math.sin(this.time.now / 100) * 0.08;

    item.container
      .setPosition(point.x, point.y - 18 * scale)
      .setScale(scale * pulse)
      .setDepth(Math.round(z * 100) + 20);
    item.glow.setSize(42, 24);
  }

  private judgeItem(item: CollectibleItem, z: number) {
    if (item.collected || z < GAME_BALANCE.obstacleJudgeZ) {
      return;
    }

    if (item.lane !== this.currentLane) {
      return;
    }

    item.collected = true;
    this.score += item.score;
    this.itemSe?.play();
    this.popFeedback(`ITEM +${item.score}`, "#ffdc73");
    this.cameras.main.flash(90, 255, 220, 115, false);
    this.layout();
  }

  private judgeObstacle(obstacle: Obstacle, z: number) {
    if (obstacle.judged || this.judgedGroupIds.has(obstacle.groupId) || z < GAME_BALANCE.obstacleJudgeZ) {
      return;
    }

    const groupObstacles = this.obstacles.filter((candidate) => candidate.groupId === obstacle.groupId);
    groupObstacles.forEach((candidate) => {
      candidate.judged = true;
    });
    this.judgedGroupIds.add(obstacle.groupId);

    if (obstacle.blockedLanes.includes(this.currentLane)) {
      this.registerMiss(groupObstacles);
      return;
    }

    this.registerAvoid(groupObstacles);
  }

  private registerAvoid(obstacles: Obstacle[]) {
    this.combo += 1;
    this.avoidCount += 1;
    const difficulty = DIFFICULTY_SETTINGS[this.selectedDifficulty];
    const scoreGain = Math.round((100 + Math.min(this.combo, 20) * 10) * difficulty.scoreMultiplier);
    this.score += scoreGain;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    obstacles.forEach((obstacle) => {
      obstacle.body.setFillStyle(0x64f5c8, 1);
      obstacle.shine.setFillStyle(0xf7fbff, 0.95);
      this.fadeOutPanel(obstacle);
    });
    const enteredFever = !this.feverActive && this.combo >= GAME_BALANCE.feverComboThreshold;
    if (enteredFever) {
      this.setFeverActive(true);
    } else {
      this.popFeedback(`+${scoreGain}`, "#64f5c8");
    }
    this.refreshHudLayout();
  }

  private registerMiss(obstacles: Obstacle[]) {
    this.combo = 0;
    this.missCount += 1;
    this.setFeverActive(false);
    obstacles.forEach((obstacle) => {
      obstacle.body.setFillStyle(0xff2f5f, 1);
      obstacle.shine.setFillStyle(0xfff1a8, 0.95);
      this.fadeOutPanel(obstacle);
    });
    if (this.time.now - this.lastMissEffectAt > 180) {
      this.lastMissEffectAt = this.time.now;
      this.cameras.main.shake(90, 0.004);
      this.flashPlayer();
      this.popFeedback("MISS", "#ff8fa3");
    }
    this.refreshHudLayout();
  }

  private refreshHudLayout() {
    if (this.time.now - this.lastLayoutRefreshAt < 50) {
      return;
    }

    this.lastLayoutRefreshAt = this.time.now;
    this.layout();
  }

  private fadeOutPanel(obstacle: Obstacle) {
    this.tweens.add({
      targets: obstacle.container,
      alpha: 0,
      scaleX: obstacle.container.scaleX * 1.12,
      scaleY: obstacle.container.scaleY * 0.82,
      duration: 180,
      ease: "Sine.Out"
    });
  }

  private popFeedback(text: string, color: string) {
    const label = this.feedbackLabel;
    if (!label) {
      return;
    }

    this.tweens.killTweensOf(label);
    label.setText(text).setColor(color).setAlpha(1).setScale(0.9);

    this.tweens.add({
      targets: label,
      alpha: 0,
      scale: 1.16,
      duration: 420,
      ease: "Sine.Out"
    });
  }

  private popResult() {
    const label = this.resultLabel;
    if (!label) {
      return;
    }

    const totalGates = new Set(this.chartObstacles.map((obstacle) => obstacle.groupId)).size;
    const avoidRate = totalGates > 0 ? Math.round((this.avoidCount / totalGates) * 100) : 0;

    this.tweens.killTweensOf(label);
    label
      .setText(
        [
          "FINISH",
          this.selectedSong.shortTitle,
          `SCORE ${this.score.toString().padStart(5, "0")}`,
          `AVOID ${this.avoidCount}/${totalGates}  ${avoidRate}%`,
          `MAX COMBO ${this.maxCombo}`,
          "TAP TO SELECT"
        ].join("\n")
      )
      .setAlpha(0)
      .setScale(0.92);

    this.tweens.add({
      targets: label,
      alpha: 1,
      scale: 1,
      duration: 260,
      ease: "Back.Out"
    });
  }

  private flashPlayer() {
    if (!this.playerBody) {
      return;
    }

    this.tweens.killTweensOf(this.playerBody);
    this.playerBody.setFillStyle(0xff5c83, 1);
    this.tweens.add({
      targets: this.playerBody,
      duration: 160,
      yoyo: true,
      repeat: 1,
      alpha: 0.55,
      onComplete: () => {
        this.playerBody?.setAlpha(1).setFillStyle(0xffd15c, 1);
      }
    });
  }

  private setFeverActive(active: boolean) {
    if (this.feverActive === active) {
      return;
    }

    this.feverActive = active;
    const label = this.feverLabel;

    if (active) {
      this.cameras.main.flash(160, 255, 220, 115, false);
      this.cameras.main.shake(110, 0.003);
      this.popFeedback("FEVER!", "#ffdc73");

      if (label) {
        this.tweens.killTweensOf(label);
        label.setAlpha(1).setScale(0.92);
        this.tweens.add({
          targets: label,
          scale: 1.08,
          duration: 240,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut"
        });
      }
    } else if (label) {
      this.tweens.killTweensOf(label);
      this.tweens.add({
        targets: label,
        alpha: 0,
        scale: 0.9,
        duration: 180,
        ease: "Sine.Out"
      });
    }

    this.layout();
  }

  private getObstacleZ(obstacle: Obstacle) {
    const approachTime = this.chartApproachTime;
    const spawnTime = obstacle.hitTime - approachTime;
    const progress = (this.songTimeSeconds - spawnTime) / approachTime;

    return Phaser.Math.Clamp(
      Phaser.Math.Linear(GAME_BALANCE.obstacleSpawnZ, GAME_BALANCE.obstacleDespawnZ, progress),
      GAME_BALANCE.obstacleSpawnZ,
      GAME_BALANCE.obstacleDespawnZ
    );
  }

  private getItemZ(item: CollectibleItem) {
    const approachTime = this.chartApproachTime;
    const spawnTime = item.hitTime - approachTime;
    const progress = (this.songTimeSeconds - spawnTime) / approachTime;

    return Phaser.Math.Clamp(
      Phaser.Math.Linear(GAME_BALANCE.obstacleSpawnZ, GAME_BALANCE.obstacleDespawnZ, progress),
      GAME_BALANCE.obstacleSpawnZ,
      GAME_BALANCE.obstacleDespawnZ
    );
  }

  private get beatIntervalMs() {
    return 60000 / (this.chart?.bpm ?? GAME_BALANCE.bpm);
  }

  private get selectedSong() {
    return SONGS[this.selectedSongIndex] ?? SONGS[0];
  }

  private get chartApproachTime() {
    return ((this.chart?.approachTime ?? 1.6) * GAME_BALANCE.chartApproachTimeScale) / this.debugSpeedFactor;
  }

  private get debugDensityFactor() {
    return Phaser.Math.Clamp(1 + this.debugDensityLevel * 0.15, 0.45, 2.2);
  }

  private get debugSpeedFactor() {
    return Phaser.Math.Clamp(1 + this.debugSpeedLevel * 0.12, 0.6, 1.9);
  }

  private get songTimeSeconds() {
    return (this.time.now - this.startTime) / 1000;
  }

  private get feverPulse() {
    if (!this.feverActive) {
      return 0;
    }

    return (Math.sin(this.time.now / 120) + 1) / 2;
  }

  private moveLane(direction: -1 | 1) {
    const nextLane = Phaser.Math.Clamp(this.currentLane + direction, 0, GAME_BALANCE.laneCount - 1);
    if (nextLane === this.currentLane) {
      return;
    }

    this.currentLane = nextLane;
    this.playMoveSe();
    this.tweens.add({
      targets: this,
      visualLane: nextLane,
      duration: GAME_BALANCE.playerLaneMoveMs,
      ease: "Back.Out",
      onUpdate: () => this.layout()
    });
  }

  private playMoveSe() {
    this.moveSe?.play();
  }

  private getLaneCenterPoint(track: TrackLayout, lane: number, z: number) {
    const left = this.getLaneBoundaryPoint(track, lane, z);
    const right = this.getLaneBoundaryPoint(track, lane + 1, z);

    return {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2
    };
  }

  private getLaneBoundaryPoint(track: TrackLayout, boundaryIndex: number, z: number) {
    const topLeft = track.centerX - track.topWidth / 2;
    const bottomLeft = track.centerX - track.bottomWidth / 2;
    const topStep = track.topWidth / GAME_BALANCE.laneCount;
    const bottomStep = track.bottomWidth / GAME_BALANCE.laneCount;

    return {
      x: Phaser.Math.Linear(topLeft + topStep * boundaryIndex, bottomLeft + bottomStep * boundaryIndex, z),
      y: Phaser.Math.Linear(track.topY, track.bottomY, z)
    };
  }

  private getPointerWorldPoint(pointer: Phaser.Input.Pointer) {
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    return {
      x: point.x,
      y: point.y
    };
  }

  private destroyScene() {
    this.bgm?.stop();
    this.bgm?.destroy();
    this.bgm = undefined;
    this.moveSe?.destroy();
    this.moveSe = undefined;
    this.itemSe?.destroy();
    this.itemSe = undefined;
    this.clearObstacles();
    this.clearItems();
    this.inputController?.destroy();
    this.inputController = undefined;
    this.input.keyboard?.off("keydown", this.handleKeyDown);
    this.input.off("pointerdown", this.handlePointerDown);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  private clearObstacles() {
    this.obstacles.forEach((obstacle) => obstacle.container.destroy(true));
    this.obstacles = [];
  }

  private clearItems() {
    this.items.forEach((item) => item.container.destroy(true));
    this.items = [];
  }
}
