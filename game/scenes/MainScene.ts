import * as Phaser from "phaser";
import { GAME_BALANCE } from "@/game/config/balance";
import { BACKGROUND_COLOR, BASE_GAME_HEIGHT, BASE_GAME_WIDTH } from "@/game/config/gameConfig";
import { SONGS, type SongDefinition } from "@/game/config/songs";
import { THEME_ASSETS, type ThemeAssetConfig } from "@/game/config/themeAssets";
import { DEFAULT_THEME, THEMES, type ThemeConfig } from "@/game/config/themes";
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
  visualType: ObstacleVisualType;
  judged: boolean;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  shine: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Ellipse;
  details: Phaser.GameObjects.Shape[];
  assetImage?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
}

interface CollectibleItem {
  lane: number;
  hitTime: number;
  itemType: ItemVisualType;
  score: number;
  collected: boolean;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Star;
  glow: Phaser.GameObjects.Ellipse;
  detail: Phaser.GameObjects.Shape;
  assetImage?: Phaser.GameObjects.Image;
}

interface Runner {
  lane: number;
  isJumping: boolean;
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  body: Phaser.GameObjects.Ellipse;
  face: Phaser.GameObjects.Ellipse;
  assetImage?: Phaser.GameObjects.Image;
  idleTween?: Phaser.Tweens.Tween;
}

interface JumpButton {
  lane: number;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  assetImage?: Phaser.GameObjects.Image;
  pressedAssetImage?: Phaser.GameObjects.Image;
}

interface ScheduledObstacle {
  time: number;
  lane: number;
  groupId: string;
  blockedLanes: number[];
  energy: number;
  visualType: ObstacleVisualType;
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
type MenuStep = "start" | "ranking" | "song" | "difficulty";
type DebugAction =
  | "densityDown"
  | "densityUp"
  | "speedDown"
  | "speedUp"
  | "trackYDown"
  | "trackYUp"
  | "farYDown"
  | "farYUp"
  | "farWDown"
  | "farWUp"
  | "nearWDown"
  | "nearWUp"
  | "bgYDown"
  | "bgYUp"
  | "bgScaleDown"
  | "bgScaleUp";
type MenuAction = "play" | "ranking" | "setting" | "help" | "back";
type RunnerVisualState = "run" | "jump" | "land" | "miss";
type ObstacleVisualType = "toy_block" | "mini_car" | "traffic_cone" | "cardboard_box" | "robot_toy";
type ItemVisualType = "star" | "music_note" | "drum" | "bell" | "toy_keyboard";

interface DifficultyButton {
  id: DifficultyId;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  assetImage?: Phaser.GameObjects.Image;
  selectedAssetImage?: Phaser.GameObjects.Image;
}

interface SongButton {
  song: SongDefinition;
  background: Phaser.GameObjects.Rectangle;
  thumbnail: Phaser.GameObjects.Rectangle;
  thumbnailAccent: Phaser.GameObjects.Rectangle;
  thumbnailMaskGraphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  assetImage?: Phaser.GameObjects.Image;
  sideAssetImage?: Phaser.GameObjects.Image;
  metaLabel: Phaser.GameObjects.Text;
  indexLabel: Phaser.GameObjects.Text;
  starLabel: Phaser.GameObjects.Text;
}

interface SongArrowButton {
  direction: -1 | 1;
  background: Phaser.GameObjects.Rectangle;
  assetImage?: Phaser.GameObjects.Image;
  pressedAssetImage?: Phaser.GameObjects.Image;
}

interface DebugButton {
  action: DebugAction;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface MenuActionButton {
  action: MenuAction;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  assetImage?: Phaser.GameObjects.Image;
  pressedAssetImage?: Phaser.GameObjects.Image;
}

interface RankingEntry {
  playerName: string;
  song: string;
  difficulty: string;
  score: number;
  avoidCount: number;
  maxCombo: number;
  missCount: number;
  createdAt: string;
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

const UI_FONT = '"Fredoka", Arial, Helvetica, sans-serif';
const RUNNER_DISPLAY_WIDTH = 228;
const RUNNER_DISPLAY_HEIGHT = 228;
const RUNNER_IDLE_FRAME = 5;
const RUNNER_MIN_SCREEN_SCALE = 0.9;
const TRACK_SCROLL_SPEED = 0.36;
const TRACK_FEVER_SCROLL_SPEED = 0.58;
const LAYOUT_DEBUG_STORAGE_KEY = "beat-runner-layout-debug-v1";
const toColorNumber = (hexColor: string) => Number.parseInt(hexColor.replace("#", ""), 16);

type LayoutDebugState = {
  trackY: number;
  farY: number;
  farW: number;
  nearW: number;
  bgY: number;
  bgScale: number;
};

const DEFAULT_LAYOUT_DEBUG: LayoutDebugState = {
  trackY: -10,
  farY: 1,
  farW: 3,
  nearW: 11,
  bgY: 1,
  bgScale: 2
};

export class MainScene extends Phaser.Scene {
  private readonly itemsEnabled = false;
  private inputController?: InputController;
  private background?: Phaser.GameObjects.Rectangle;
  private skyImage?: Phaser.GameObjects.Image;
  private startBackgroundPortraitImage?: Phaser.GameObjects.Image;
  private startBackgroundLandscapeImage?: Phaser.GameObjects.Image;
  private menuBackgroundPortraitImage?: Phaser.GameObjects.Image;
  private menuBackgroundLandscapeImage?: Phaser.GameObjects.Image;
  private gameplayBackgroundImages: Phaser.GameObjects.Image[] = [];
  private deskSurfaceImage?: Phaser.GameObjects.Image;
  private toyRoadImage?: Phaser.GameObjects.Image;
  private toyBlocksDecorImage?: Phaser.GameObjects.Image;
  private blurredToysDecorImage?: Phaser.GameObjects.Image;
  private laneOverlayImages: Phaser.GameObjects.Image[] = [];
  private comboBadgeImage?: Phaser.GameObjects.Image;
  private scoreStickerImage?: Phaser.GameObjects.Image;
  private missStickerImage?: Phaser.GameObjects.Image;
  private feverBadgeImage?: Phaser.GameObjects.Image;
  private rankingPanelImage?: Phaser.GameObjects.Image;
  private rankingTitleImage?: Phaser.GameObjects.Image;
  private trackGraphics?: Phaser.GameObjects.Graphics;
  private hudGraphics?: Phaser.GameObjects.Graphics;
  private feverGraphics?: Phaser.GameObjects.Graphics;
  private runners: Runner[] = [];
  private jumpButtons: JumpButton[] = [];
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
  private debugLayoutLabels: Phaser.GameObjects.Text[] = [];
  private songButtons: SongButton[] = [];
  private songSelectTitleImage?: Phaser.GameObjects.Image;
  private difficultyTitleImage?: Phaser.GameObjects.Image;
  private songSelectPaginationImage?: Phaser.GameObjects.Image;
  private songArrowButtons: SongArrowButton[] = [];
  private difficultyButtons: DifficultyButton[] = [];
  private debugButtons: DebugButton[] = [];
  private menuButtons: MenuActionButton[] = [];
  private rankingLabels: Phaser.GameObjects.Text[] = [];
  private rankings: RankingEntry[] = [];
  private bgm?: Phaser.Sound.BaseSound;
  private moveSe?: Phaser.Sound.BaseSound;
  private itemSe?: Phaser.Sound.BaseSound;
  private redPerformanceSe?: Phaser.Sound.BaseSound;
  private yellowPerformanceSe?: Phaser.Sound.BaseSound;
  private bluePerformanceSe?: Phaser.Sound.BaseSound;
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
  private menuStep: MenuStep = "start";
  private selectedSongIndex = 0;
  private selectedDifficulty: DifficultyId = "normal";
  private debugDensityLevel = 0;
  private debugSpeedLevel = 0;
  private layoutDebug: LayoutDebugState = { ...DEFAULT_LAYOUT_DEBUG };
  private lastMissEffectAt = 0;
  private lastLayoutRefreshAt = 0;
  private lastFeverCameraBumpAt = 0;
  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!this.gameStarted) {
      if (this.gameEnded) {
        this.showStartScreen();
        return;
      }

      const pointerPosition = this.getPointerWorldPoint(pointer);
      if (
        (this.menuStep === "start" || this.menuStep === "ranking" || this.menuStep === "song" || this.menuStep === "difficulty") &&
        this.tryPressMenuButton(pointerPosition.x, pointerPosition.y)
      ) {
        return;
      }

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
    this.tryJumpFromPointer(pointerPosition.x, pointerPosition.y);
  };
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    if ((this.gameStarted || (!this.gameEnded && this.menuStep === "difficulty")) && this.tryLayoutDebugHotkey(event)) {
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      if (!this.gameStarted) {
        if (this.gameEnded) {
          this.showStartScreen();
        } else if (this.menuStep === "song") {
          this.browseSongByOffset(-1);
        }
        return;
      }
      this.jumpRunner(0);
      return;
    }

    if (event.code === "ArrowDown" || event.code === "ArrowUp" || event.code === "KeyS") {
      event.preventDefault();
      if (!this.gameStarted) {
        if (this.gameEnded) {
          this.showStartScreen();
        } else if (this.menuStep === "song") {
          this.browseSongByOffset(1);
        }
        return;
      }
      this.jumpRunner(1);
      return;
    }

    if (event.code === "ArrowRight" || event.code === "KeyD") {
      event.preventDefault();
      if (!this.gameStarted) {
        if (this.gameEnded) {
          this.showStartScreen();
        } else if (this.menuStep === "song") {
          this.browseSongByOffset(1);
        }
        return;
      }
      this.jumpRunner(2);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "start" && (event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      this.showSongSelect();
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "start" && event.code === "KeyR") {
      event.preventDefault();
      this.showRankingScreen();
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "ranking" && (event.code === "Escape" || event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      this.showStartScreen();
      return;
    }

    if (this.gameStarted && (event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3")) {
      event.preventDefault();
      const lane = event.code === "Digit1" ? 0 : event.code === "Digit2" ? 1 : 2;
      this.jumpRunner(lane);
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
      this.browseSongByOffset(event.code === "KeyQ" ? -1 : 1);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "song" && event.code === "Escape") {
      event.preventDefault();
      this.showStartScreen();
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "song" && (event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      this.selectSong(this.selectedSongIndex);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "difficulty") {
      if (event.code === "Escape") {
        event.preventDefault();
        this.showSongSelect();
        return;
      }

      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        this.startRun();
        return;
      }

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
    this.loadLayoutDebug();
    this.createPrototypeView();
    this.loadRankings();
    this.createSelectedBgm();
    this.moveSe = this.sound.add("se_move_beat", { volume: 0.68 });
    this.itemSe = this.sound.add("se_item_collect", { volume: 0.76 });
    this.redPerformanceSe = this.sound.add("se_character_red", { volume: 0.86 });
    this.yellowPerformanceSe = this.sound.add("se_character_yellow", { volume: 0.86 });
    this.bluePerformanceSe = this.sound.add("se_character_blue", { volume: 0.86 });
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
    if (this.itemsEnabled) {
      this.updateItemSpawns();
    }
    this.updateObstacles();
    if (this.itemsEnabled) {
      this.updateItems();
    }
    const track = this.getTrackLayout();
    this.layoutBackgroundImages(track);
    this.drawTrack(track);
    this.layoutPlayers(track);
    if (this.feverActive) {
      this.drawFeverLayer();
      this.updateFeverCameraBump();
    }
  }

  private createPrototypeView() {
    const theme = this.currentTheme;
    this.background = this.add.rectangle(0, 0, 1, 1, this.themeColor("background")).setOrigin(0).setDepth(-32);
    this.skyImage = this.createThemeImage(this.currentThemeAssets.background.sky, 0, 0, -31);
    this.startBackgroundPortraitImage = this.createThemeImage(this.currentThemeAssets.background.start.portrait, 0, 0, -30);
    this.startBackgroundLandscapeImage = this.createThemeImage(this.currentThemeAssets.background.start.landscape, 0, 0, -30);
    this.menuBackgroundPortraitImage = this.createThemeImage(this.currentThemeAssets.background.menu.portrait, 0, 0, -30);
    this.menuBackgroundLandscapeImage = this.createThemeImage(this.currentThemeAssets.background.menu.landscape, 0, 0, -30);
    this.gameplayBackgroundImages = [0, 1].flatMap(() => {
      const assetKey = this.isPortrait ? this.currentThemeAssets.background.gameplay.portrait : this.currentThemeAssets.background.gameplay.landscape;
      const image = this.createThemeImage(assetKey, 0, 0, -28);
      return image ? [image] : [];
    });
    this.deskSurfaceImage = this.createThemeImage(this.currentThemeAssets.background.decoration[1], 0, 0, -29);
    this.toyBlocksDecorImage = this.createThemeImage(this.currentThemeAssets.background.decoration[0], 0, 0, -3);
    this.blurredToysDecorImage = this.createThemeImage(this.currentThemeAssets.background.decoration[2], 0, 0, -4);
    this.toyRoadImage = this.createThemeImage(this.currentThemeAssets.background.floor, 0, 0, -2);
    this.laneOverlayImages = [
      this.currentThemeAssets.lanes.left,
      this.currentThemeAssets.lanes.center,
      this.currentThemeAssets.lanes.right
    ].flatMap((assetKey) => {
      const image = this.createThemeImage(assetKey, 0, 0, 2);
      return image ? [image] : [];
    });
    this.comboBadgeImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudCombo, 0, 0, 299.5);
    this.scoreStickerImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudScore, 0, 0, 299.5);
    this.missStickerImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudMiss, 0, 0, 299.5);
    this.feverBadgeImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudFever, 0, 0, 299.5);
    this.rankingPanelImage = this.createThemeImage(this.currentThemeAssets.ui.parts.rankingPanel, 0, 0, 314);
    this.rankingTitleImage = this.createThemeImage(this.currentThemeAssets.ui.parts.rankingTitle, 0, 0, 315);
    this.trackGraphics = this.add.graphics().setDepth(1);
    this.hudGraphics = this.add.graphics().setDepth(299);
    this.feverGraphics = this.add.graphics().setDepth(298);

    this.runners = Array.from({ length: GAME_BALANCE.laneCount }, (_, lane) => {
      const shadow = this.add.ellipse(0, 58, 124, 34, this.themeColor("shadow"), 0.32);
      const body = this.add.ellipse(0, 0, 44, 54, this.runnerColor(lane));
      const face = this.add.ellipse(0, -8, 24, 20, this.themeColor("background"));
      const assetImage = this.createRunnerAssetImage(lane);
      const containerChildren: Phaser.GameObjects.GameObject[] = assetImage ? [shadow, body, face, assetImage] : [shadow, body, face];
      const container = this.add.container(0, 0, containerChildren).setDepth(160 + lane);
      if (assetImage) {
        body.setAlpha(0);
        face.setAlpha(0);
      }

      return {
        lane,
        isJumping: false,
        container,
        shadow,
        body,
        face,
        assetImage
      };
    });

    this.titleLabel = this.add
      .text(0, 0, "BEAT RUNNER", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.laneLabel = this.add
      .text(0, 0, "PROTOTYPE", {
        fontFamily: UI_FONT,
        fontStyle: "700",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.sizeLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        color: theme.colors.primary,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.comboLabel = this.add
      .text(0, 0, "0", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "left"
      })
      .setOrigin(0, 0.5)
      .setDepth(300);

    this.scoreLabel = this.add
      .text(0, 0, "000000", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(300);

    this.missLabel = this.add
      .text(0, 0, "000", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.primary,
        align: "right"
      })
      .setOrigin(1, 0.5)
      .setDepth(300);

    this.feverLabel = this.add
      .text(0, 0, "FEVER", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(300);

    this.feedbackLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(300);

    this.startLabel = this.add
      .text(0, 0, "START", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(320);

    this.resultLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330)
      .setLineSpacing(8);

    this.debugDensityLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(316);

    this.debugSpeedLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.secondary,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(316);

    this.debugLayoutLabels = Array.from({ length: 6 }, () =>
      this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316)
    );

    this.songSelectTitleImage = this.createThemeImage(this.currentThemeAssets.ui.parts.titleBanner, 0, 0, 315);
    this.difficultyTitleImage = this.createThemeImage(this.currentThemeAssets.ui.parts.titleLevelBanner, 0, 0, 315);
    this.songSelectPaginationImage = this.createThemeImage(this.currentThemeAssets.ui.parts.paginationDots, 0, 0, 316);
    this.songArrowButtons = [
      { direction: -1 as const, assetKey: this.currentThemeAssets.ui.parts.arrowLeft, pressedAssetKey: this.currentThemeAssets.ui.parts.arrowLeftPressed },
      { direction: 1 as const, assetKey: this.currentThemeAssets.ui.parts.arrowRight, pressedAssetKey: this.currentThemeAssets.ui.parts.arrowRightPressed }
    ].map(({ direction, assetKey, pressedAssetKey }) => {
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("surface"), 0).setDepth(317);
      const assetImage = this.createThemeImage(assetKey, 0, 0, 318);
      const pressedAssetImage = this.createThemeImage(pressedAssetKey, 0, 0, 318.1);
      pressedAssetImage?.setAlpha(0);
      return { direction, background, assetImage, pressedAssetImage };
    });

    this.songButtons = SONGS.map((song) => {
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("track"), 0.95).setDepth(315);
      const assetImage = this.createThemeImage(this.currentThemeAssets.ui.parts.songCardLarge, 0, 0, 315);
      const sideAssetImage = this.createThemeImage(this.currentThemeAssets.ui.parts.songCardLarge, 0, 0, 314);
      const thumbnail = this.add.rectangle(0, 0, 1, 1, this.themeColor("rightLane"), 0.92).setDepth(315.4);
      const thumbnailAccent = this.add.rectangle(0, 0, 1, 1, this.themeColor("accent"), 0.82).setDepth(315.5);
      const thumbnailMaskGraphics = this.make.graphics({ x: 0, y: 0 });
      const thumbnailMask = thumbnailMaskGraphics.createGeometryMask();
      thumbnail.setMask(thumbnailMask);
      thumbnailAccent.setMask(thumbnailMask);
      const indexLabel = this.add
        .text(0, 0, "01", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.accent,
          align: "left"
        })
        .setOrigin(0, 0.5)
        .setDepth(316);
      const label = this.add
        .text(0, 0, song.shortTitle, {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);
      const metaLabel = this.add
        .text(0, 0, `BPM ${Math.round(song.bpm)}`, {
          fontFamily: UI_FONT,
          fontStyle: "800",
          color: theme.colors.text,
          align: "left"
        })
        .setOrigin(0, 0.5)
        .setDepth(316);
      const starLabel = this.add
        .text(0, 0, "★ ★ ★ ☆ ☆", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.accent,
          align: "left"
        })
        .setOrigin(0, 0.5)
        .setDepth(316);

      background.setStrokeStyle(2, this.themeColor("line"), 0.65);

      return { song, background, thumbnail, thumbnailAccent, thumbnailMaskGraphics, label, assetImage, sideAssetImage, metaLabel, indexLabel, starLabel };
    });

    this.difficultyButtons = (["easy", "normal", "hard"] as DifficultyId[]).map((id) => {
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("trackAlt"), 0.95).setDepth(315);
      const assetImage = this.createThemeImage(this.getDifficultyAssetKey(id), 0, 0, 315);
      const selectedAssetImage = this.createThemeImage(this.getSelectedDifficultyAssetKey(id), 0, 0, 315.1);
      const label = this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);

      background.setStrokeStyle(2, this.themeColor("line"), 0.65);
      selectedAssetImage?.setAlpha(0);

      return { id, background, label, assetImage, selectedAssetImage };
    });

    this.debugButtons = (
      [
        "densityDown",
        "densityUp",
        "speedDown",
        "speedUp",
        "trackYDown",
        "trackYUp",
        "farYDown",
        "farYUp",
        "farWDown",
        "farWUp",
        "nearWDown",
        "nearWUp",
        "bgYDown",
        "bgYUp",
        "bgScaleDown",
        "bgScaleUp"
      ] as DebugAction[]
    ).map((action) => {
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("surface"), 0.95).setDepth(315);
      const label = this.add
        .text(0, 0, action.endsWith("Down") ? "-" : "+", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);

      background.setStrokeStyle(2, this.themeColor("line"), 0.65);

      return { action, background, label };
    });

    this.menuButtons = [
      { action: "play" as const, text: "START", assetKey: this.currentThemeAssets.ui.parts.buttonPrimary, pressedAssetKey: this.currentThemeAssets.ui.parts.buttonPrimaryPressed },
      { action: "ranking" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconTrophy, pressedAssetKey: this.currentThemeAssets.ui.parts.iconTrophyPressed },
      { action: "setting" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconGear, pressedAssetKey: this.currentThemeAssets.ui.parts.iconGearPressed },
      { action: "help" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconHelp, pressedAssetKey: this.currentThemeAssets.ui.parts.iconHelpPressed },
      { action: "back" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.arrowLeft, pressedAssetKey: this.currentThemeAssets.ui.parts.arrowLeftPressed }
    ].map(({ action, text, assetKey, pressedAssetKey }) => {
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("track"), 0.95).setDepth(315);
      const assetImage = this.createThemeImage(assetKey, 0, 0, 315);
      const pressedAssetImage = this.createThemeImage(pressedAssetKey, 0, 0, 315.1);
      const label = this.add
        .text(0, 0, text, {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316);

      background.setStrokeStyle(2, this.themeColor("line"), 0.75);
      pressedAssetImage?.setAlpha(0);

      return { action, background, label, assetImage, pressedAssetImage };
    });

    this.rankingLabels = Array.from({ length: 7 }, () =>
      this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(316)
        .setAlpha(0)
    );

    this.jumpButtons = Array.from({ length: GAME_BALANCE.laneCount }, (_, lane) => {
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("track"), 0.95).setDepth(340);
      const assetImage = this.createThemeImage(this.getJumpButtonAssetKey(lane), 0, 0, 340);
      const pressedAssetImage = this.createThemeImage(this.getJumpButtonPressedAssetKey(lane), 0, 0, 340.1);
      const label = this.add
        .text(0, 0, ["LEFT", "CENTER", "RIGHT"][lane], {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(341);

      background.setStrokeStyle(2, this.themeColor("line"), 0.75);

      pressedAssetImage?.setAlpha(0);

      return { lane, background, label, assetImage, pressedAssetImage };
    });
  }

  private layout() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const track = this.getTrackLayout();
    const theme = this.currentTheme;

    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    this.background?.setPosition(0, 0).setSize(width, height).setFillStyle(this.themeColor("background"));
    this.layoutBackgroundImages(track);
    if (this.gameStarted || this.gameEnded) {
      this.drawTrack(track);
      this.trackGraphics?.setAlpha(1);
      this.layoutLaneOverlays(track);
      this.drawFeverLayer();
      this.layoutPlayers(track);
      this.setRunnersVisible(true);
      this.layoutObstacles(track);
      if (this.itemsEnabled) {
        this.layoutItems(track);
      }
    } else {
      this.drawMenuBackground();
      this.trackGraphics?.setAlpha(1);
      this.layoutLaneOverlays(track);
      this.feverGraphics?.clear();
      this.setRunnersVisible(false);
    }
    this.layoutJumpButtons();
    this.drawHudStickers();
    this.layoutHudAssetImages();

    const usesDesignedMenuTitle =
      !this.gameStarted &&
      !this.gameEnded &&
      (this.menuStep === "start" || this.menuStep === "song" || this.menuStep === "difficulty" || this.menuStep === "ranking");

    this.titleLabel
      ?.setPosition(width / 2, 32 * screenScale)
      .setFontSize(Math.round(32 * screenScale))
      .setColor(theme.colors.text)
      .setAlpha(usesDesignedMenuTitle || this.gameStarted || this.gameEnded ? 0 : 1);

    this.laneLabel
      ?.setPosition(width / 2, 88 * screenScale)
      .setFontSize(Math.round(16 * screenScale))
      .setColor(theme.colors.accent)
      .setText(this.getMenuSubTitle())
      .setAlpha(usesDesignedMenuTitle || this.gameStarted || this.gameEnded ? 0 : 1);

    this.comboLabel
      ?.setOrigin(0.5)
      .setPosition(88 * Math.max(screenScale, 0.94), 129 * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(29 * Math.max(screenScale, 0.94), 24, 36)))
      .setAlign("center")
      .setColor(theme.colors.text)
      .setStroke(theme.colors.line, Math.round(5 * Math.max(screenScale, 0.94)))
      .setLineSpacing(-5 * Math.max(screenScale, 0.94))
      .setText(`${this.combo}`)
      .setAlpha(this.gameStarted || this.gameEnded ? 1 : 0);

    this.scoreLabel
      ?.setOrigin(0.5)
      .setPosition(86 * Math.max(screenScale, 0.94), 64 * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(27 * Math.max(screenScale, 0.94), 23, 34)))
      .setAlign("center")
      .setColor(theme.colors.text)
      .setStroke(theme.colors.line, Math.round(6 * Math.max(screenScale, 0.94)))
      .setLineSpacing(-4 * Math.max(screenScale, 0.94))
      .setText(this.score.toString().padStart(6, "0"))
      .setAlpha(this.gameStarted || this.gameEnded ? 1 : 0);

    this.missLabel
      ?.setOrigin(0.5)
      .setPosition(width - 82 * Math.max(screenScale, 0.94), 64 * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(27 * Math.max(screenScale, 0.94), 23, 34)))
      .setAlign("center")
      .setColor(theme.colors.text)
      .setStroke(theme.colors.line, Math.round(6 * Math.max(screenScale, 0.94)))
      .setLineSpacing(-4 * Math.max(screenScale, 0.94))
      .setText(this.missCount.toString().padStart(3, "0"))
      .setAlpha(this.gameStarted || this.gameEnded ? 1 : 0);

    this.feverLabel
      ?.setPosition(width / 2, 98 * screenScale)
      .setFontSize(Math.round(22 * screenScale));

    this.feedbackLabel
      ?.setPosition(width / 2, height * (this.isPortrait ? 0.28 : 0.36))
      .setFontSize(Math.round(24 * screenScale));

    const menuTitleScale = Math.max(screenScale, this.isPortrait ? 0.92 : 0.85);
    const usesTopMenuTitle = this.menuStep === "song" || this.menuStep === "difficulty";
    const topMenuTitleY = height * (this.isPortrait ? 0.105 : 0.12) + 3 * menuTitleScale;
    this.startLabel
      ?.setPosition(width / 2, usesTopMenuTitle ? topMenuTitleY : height * 0.43)
      .setFontSize(usesTopMenuTitle ? Math.round(Phaser.Math.Clamp(23 * menuTitleScale, 19, 26)) : Math.round(30 * screenScale))
      .setText(usesTopMenuTitle ? "" : this.getMenuTitle())
      .setAlpha(!this.gameStarted && !this.gameEnded && this.menuStep !== "start" && !usesTopMenuTitle ? 1 : 0);

    this.resultLabel
      ?.setPosition(width / 2, height * 0.46)
      .setFontSize(Math.round(24 * screenScale));

    this.layoutSongButtons();
    this.layoutDifficultyButtons();
    this.layoutDebugButtons();
    this.layoutMenuButtons();
    this.layoutRankingLabels();

    this.sizeLabel
      ?.setPosition(width / 2, height - 24 * screenScale)
      .setFontSize(Math.round(18 * screenScale))
      .setText(`${width} x ${height}`)
      .setAlpha(0);
  }

  private getMenuTitle() {
    if (this.gameEnded) {
      return "";
    }

    if (this.menuStep === "start") {
      return "";
    }

    if (this.menuStep === "ranking") {
      return "";
    }

    if (this.menuStep === "song") {
      return "SELECT SONG";
    }

    return "SELECT LEVEL";
  }

  private layoutBackgroundImages(track: TrackLayout) {
    const { width, height } = this.scale;
    const isSimpleStartScreen = !this.gameStarted && !this.gameEnded && this.menuStep === "start";
    const isMenuScreen = !this.gameStarted && !this.gameEnded && this.menuStep !== "start";
    const showGameBackground = !isSimpleStartScreen && !isMenuScreen;
    const roadHeight = Math.max(track.bottomY - track.topY + 130 * this.screenScale, height * 0.68);
    const roadWidth = Math.max(track.bottomWidth * 1.42, width * 0.52);

    this.skyImage
      ?.setPosition(width / 2, height / 2)
      .setDisplaySize(width, height)
      .setAlpha(showGameBackground ? 0.52 : 0)
      .setVisible(showGameBackground);

    this.layoutCoverBackgroundImage(this.startBackgroundPortraitImage, isSimpleStartScreen && this.isPortrait);
    this.layoutCoverBackgroundImage(this.startBackgroundLandscapeImage, isSimpleStartScreen && !this.isPortrait);
    this.layoutCoverBackgroundImage(this.menuBackgroundPortraitImage, isMenuScreen && this.isPortrait);
    this.layoutCoverBackgroundImage(this.menuBackgroundLandscapeImage, isMenuScreen && !this.isPortrait);
    this.layoutGameplayScrollingBackground(this.gameStarted || this.gameEnded);

    this.deskSurfaceImage
      ?.setPosition(width / 2, height / 2)
      .setDisplaySize(width, height)
      .setAlpha(showGameBackground ? (this.gameStarted ? 0.16 : this.skyImage ? 0.42 : 0.78) : 0)
      .setVisible(showGameBackground);

    const decorScale = this.screenScale;
    this.toyBlocksDecorImage
      ?.setPosition(width * (this.isPortrait ? 0.13 : 0.2), track.bottomY - 40 * decorScale)
      .setDisplaySize(150 * decorScale, 118 * decorScale)
      .setAlpha(showGameBackground && !this.gameStarted ? 0.72 : 0)
      .setVisible(showGameBackground && !this.gameStarted);

    this.blurredToysDecorImage
      ?.setPosition(width * (this.isPortrait ? 0.88 : 0.82), height * 0.24)
      .setDisplaySize(190 * decorScale, 130 * decorScale)
      .setAlpha(showGameBackground && !this.gameStarted ? 0.48 : 0)
      .setVisible(showGameBackground && !this.gameStarted);

    this.toyRoadImage
      ?.setPosition(track.centerX, (track.topY + track.bottomY) / 2 + 18 * this.screenScale)
      .setDisplaySize(roadWidth, roadHeight)
      .setAlpha(showGameBackground && !this.gameStarted ? (this.gameEnded ? 0.16 : 0.34) : 0)
      .setVisible(showGameBackground && !this.gameStarted);
  }

  private layoutGameplayScrollingBackground(isVisible: boolean) {
    const { width, height } = this.scale;
    const images = this.gameplayBackgroundImages;
    if (images.length === 0) {
      return;
    }

    const source = images[0].texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const sourceWidth = source.width || width;
    const sourceHeight = source.height || height;
    const coverScale = Math.max(width / sourceWidth, height / sourceHeight) * (1 + this.layoutDebug.bgScale * 0.035);
    const displayWidth = sourceWidth * coverScale;
    const displayHeight = sourceHeight * coverScale;
    const y = height / 2 + height * this.layoutDebug.bgY * 0.01;

    images.forEach((image, index) => {
      image
        .setPosition(width / 2, y)
        .setDisplaySize(displayWidth, displayHeight)
        .setAlpha(isVisible && index === 0 ? 0.88 : 0)
        .setVisible(isVisible && index === 0);
    });
  }

  private layoutCoverBackgroundImage(image: Phaser.GameObjects.Image | undefined, isVisible: boolean) {
    if (!image) {
      return;
    }

    const { width, height } = this.scale;
    const texture = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const sourceWidth = texture.width || width;
    const sourceHeight = texture.height || height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);

    image
      .setPosition(width / 2, height / 2)
      .setDisplaySize(sourceWidth * scale, sourceHeight * scale)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
  }

  private layoutLaneOverlays(track: TrackLayout) {
    this.laneOverlayImages.forEach((image, lane) => {
      image.setAlpha(0).setVisible(false);
    });
  }

  private getMenuSubTitle() {
    if (this.gameStarted || this.gameEnded) {
      return `${this.currentTheme.genre} / ${DIFFICULTY_SETTINGS[this.selectedDifficulty].label}`;
    }

    if (this.menuStep === "start") {
      return "TOY DIORAMA RHYTHM RUN";
    }

    if (this.menuStep === "ranking") {
      return "";
    }

    if (this.menuStep === "song") {
      return "CHOOSE YOUR TRACK";
    }

    return `${this.currentTheme.name} / ${DIFFICULTY_SETTINGS[this.selectedDifficulty].label}`;
  }

  private layoutMenuButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const theme = this.currentTheme;
    const isStartScreen = this.menuStep === "start" && !this.gameStarted && !this.gameEnded;
    const isSongScreen = this.menuStep === "song" && !this.gameStarted && !this.gameEnded;
    const isDifficultyScreen = this.menuStep === "difficulty" && !this.gameStarted && !this.gameEnded;
    const startButtonScale = isStartScreen ? Math.max(screenScale, this.isPortrait ? 1 : 0.9) : screenScale;
    const buttonWidth = isStartScreen
      ? Math.min(width * (this.isPortrait ? 0.78 : 0.34), 420 * startButtonScale)
      : isDifficultyScreen
        ? Math.min(width * (this.isPortrait ? 0.68 : 0.3), 350 * Math.max(screenScale, 0.9))
        : Math.min(width * 0.72, 280 * screenScale);
    const buttonHeight = isStartScreen ? 82 * startButtonScale : isDifficultyScreen ? 68 * Math.max(screenScale, 0.9) : 54 * screenScale;
    const difficultyStartButtonWidth = Math.min(width * (this.isPortrait ? 0.78 : 0.34), 420 * Math.max(screenScale, 0.9));
    const difficultyStartButtonHeight = 82 * Math.max(screenScale, 0.9);
    const iconSize = Math.round(Phaser.Math.Clamp(68 * startButtonScale, 58, this.isPortrait ? 82 : 76));
    const textSize = Math.round(Phaser.Math.Clamp((isStartScreen ? 27 : isDifficultyScreen ? 25 : 18) * Math.max(startButtonScale, 0.9), 15, 36));
    const centerX = width / 2;
    const startY = isStartScreen ? height * (this.isPortrait ? 0.73 : 0.75) : isDifficultyScreen ? height * (this.isPortrait ? 0.64 : 0.66) : height * 0.55;
    const iconY = isStartScreen ? height * (this.isPortrait ? 0.86 : 0.88) : startY + 78 * startButtonScale;
    const iconGap = iconSize * (this.isPortrait ? 1.36 : 1.48);

    this.menuButtons.forEach((button) => {
      const isIconAction = button.action === "ranking" || button.action === "setting" || button.action === "help";
      const isStartButton = this.menuStep === "start" && (button.action === "play" || isIconAction);
      const isSongSettingButton = isSongScreen && button.action === "setting";
      const isDifficultySettingButton = isDifficultyScreen && button.action === "setting";
      const isDifficultyStartButton = isDifficultyScreen && button.action === "play";
      const isBackButton = (this.menuStep === "ranking" || isDifficultyScreen) && button.action === "back";
      const isVisible = !this.gameStarted && !this.gameEnded && (isStartButton || isSongSettingButton || isDifficultySettingButton || isDifficultyStartButton || isBackButton);
      const isRankingBackButton = button.action === "back" && this.menuStep === "ranking";
      const isDifficultyBackButton = button.action === "back" && isDifficultyScreen;
      const isLowerRightSettingButton = isSongSettingButton || isDifficultySettingButton;
      const backButtonSize = Math.round(Phaser.Math.Clamp(58 * Math.max(screenScale, 0.9), 52, 72));
      const songSettingButtonSize = Math.round(Phaser.Math.Clamp(58 * Math.max(screenScale, 0.9), 52, 72));
      const difficultyButtonGap = 12 * Math.max(screenScale, 0.9);
      const difficultyBackX = centerX - difficultyStartButtonWidth / 2 - difficultyButtonGap - backButtonSize / 2;
      const x = isRankingBackButton
        ? width * (this.isPortrait ? 0.23 : 0.12)
        : isDifficultyBackButton
          ? difficultyBackX
        : isLowerRightSettingButton
          ? width * (this.isPortrait ? 0.86 : 0.91)
        : isStartScreen && isIconAction
          ? centerX + (button.action === "ranking" ? -iconGap : button.action === "help" ? iconGap : 0)
          : centerX;
      const y =
        button.action === "play"
          ? startY
          : isDifficultyBackButton
            ? startY
          : isRankingBackButton
            ? height * (this.isPortrait ? 0.9 : 0.86)
            : isLowerRightSettingButton
              ? height * (this.isPortrait ? 0.9 : 0.86)
            : isIconAction
            ? iconY
            : height * 0.84;
      const fillColor = button.action === "play" ? this.themeColor("secondary") : this.themeColor("trackAlt");
      const textColor = theme.colors.text;
      const displayWidth = isRankingBackButton || isDifficultyBackButton ? backButtonSize : isLowerRightSettingButton ? songSettingButtonSize : isStartScreen && isIconAction ? iconSize : isDifficultyStartButton ? difficultyStartButtonWidth : buttonWidth;
      const displayHeight = isRankingBackButton || isDifficultyBackButton ? backButtonSize : isLowerRightSettingButton ? songSettingButtonSize : isStartScreen && isIconAction ? iconSize : isDifficultyStartButton ? difficultyStartButtonHeight : buttonHeight;
      const imageWidth = isRankingBackButton || isDifficultyBackButton || isLowerRightSettingButton || (isStartScreen && isIconAction) ? displayWidth : displayWidth * 1.08;
      const imageHeight = isRankingBackButton || isDifficultyBackButton || isLowerRightSettingButton || (isStartScreen && isIconAction) ? displayHeight : displayHeight * 1.18;

      button.background
        .setPosition(x, y)
        .setSize(displayWidth, displayHeight)
        .setFillStyle(fillColor, button.assetImage ? 0 : isVisible ? 0.95 : 0)
        .setStrokeStyle(2 * screenScale, button.action === "play" ? this.themeColor("line") : this.themeColor("primary"), button.assetImage ? 0 : isVisible ? 0.75 : 0)
        .setAlpha(isVisible ? 1 : 0);
      button.assetImage
        ?.setPosition(x, y)
        .setAlpha(isVisible ? 0.95 : 0);
      this.fitImageInBox(button.assetImage, imageWidth, imageHeight);
      button.pressedAssetImage
        ?.setPosition(x, y)
        .setAlpha(0)
        .setVisible(isVisible);
      this.fitImageInBox(button.pressedAssetImage, imageWidth, imageHeight);
      button.label
        .setPosition(x, y)
        .setFontSize(isRankingBackButton || isDifficultyBackButton || isLowerRightSettingButton ? Math.round(Phaser.Math.Clamp(16 * Math.max(screenScale, 0.9), 13, 20)) : textSize)
        .setColor(textColor)
        .setAlpha(isVisible && button.label.text && !button.assetImage ? 1 : 0);
    });
  }

  private layoutRankingLabels() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const isVisible = !this.gameStarted && !this.gameEnded && this.menuStep === "ranking";
    const titleWidth = Math.min(width * 0.74, 430 * Math.max(screenScale, 0.9));
    const titleHeight = titleWidth * 0.36;
    const titleY = height * (this.isPortrait ? 0.215 : 0.185);
    const panelCenterY = height * (this.isPortrait ? 0.5 : 0.47);
    const rowCenterRatios = [0.218, 0.318, 0.417, 0.518, 0.619, 0.723, 0.825];
    const textSize = Math.round(Phaser.Math.Clamp(15 * screenScale, 12, 22));
    const rows =
      this.rankings.length > 0
        ? this.rankings.slice(0, this.rankingLabels.length).map((entry, index) => {
            const rank = `${index + 1}.`.padEnd(3, " ");
            return `${rank} ${entry.score.toString().padStart(5, "0")}  ${entry.playerName}  ${entry.song}  ${entry.difficulty}`;
          })
        : ["NO SCORES YET"];

    this.rankingTitleImage
      ?.setPosition(width / 2, titleY)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(this.rankingTitleImage, titleWidth, titleHeight);

    this.rankingPanelImage
      ?.setPosition(width / 2, panelCenterY)
      .setAlpha(isVisible ? 0.92 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(this.rankingPanelImage, Math.min(width * 0.9, 520 * screenScale), 350 * screenScale);

    this.rankingLabels.forEach((label, index) => {
      const rowText = rows[index] ?? "";
      const rowY = this.rankingPanelImage
        ? this.rankingPanelImage.y - this.rankingPanelImage.displayHeight / 2 + this.rankingPanelImage.displayHeight * (rowCenterRatios[index] ?? rowCenterRatios[0])
        : panelCenterY;

      label
        .setPosition(width / 2, rowY)
        .setFontSize(textSize)
        .setText(rowText)
        .setAlpha(isVisible && rowText ? 1 : 0);
    });
  }

  private drawHudStickers() {
    const graphics = this.hudGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    if (!this.gameStarted && !this.gameEnded) {
      return;
    }

    const { width } = this.scale;
    const scale = Math.max(this.screenScale, 0.86);

    const filledStars = Phaser.Math.Clamp(Math.floor(this.combo / Math.max(1, GAME_BALANCE.feverComboThreshold / 5)), 0, 5);
    const gaugeX = width - 104 * scale;
    const gaugeY = 104 * scale;
    for (let index = 0; index < 5; index += 1) {
      graphics.fillStyle(index < filledStars ? this.themeColor("accent") : this.themeColor("line"), index < filledStars ? 1 : 0.5);
      this.fillGraphicsStar(graphics, gaugeX + index * 36 * scale, gaugeY, 5, 6 * scale, 13 * scale);
    }
  }

  private layoutHudAssetImages() {
    const { width } = this.scale;
    const scale = Math.max(this.screenScale, 0.94);
    const isHudVisible = this.gameStarted || this.gameEnded;
    const scoreWidth = 156 * scale;
    const scoreHeight = 104 * scale;
    const comboWidth = 152 * scale;
    const comboHeight = 104 * scale;
    const missWidth = 140 * scale;
    const missHeight = 104 * scale;

    this.comboBadgeImage
      ?.setPosition(12 * scale + comboWidth / 2, 68 * scale + comboHeight / 2)
      .setAlpha(isHudVisible ? 1 : 0)
      .setVisible(isHudVisible);
    this.fitImageInBox(this.comboBadgeImage, comboWidth, comboHeight);

    this.scoreStickerImage
      ?.setPosition(8 * scale + scoreWidth / 2, 6 * scale + scoreHeight / 2)
      .setAlpha(isHudVisible ? 1 : 0)
      .setVisible(isHudVisible);
    this.fitImageInBox(this.scoreStickerImage, scoreWidth, scoreHeight);

    this.missStickerImage
      ?.setPosition(width - missWidth / 2 - 12 * scale, 6 * scale + missHeight / 2)
      .setAlpha(isHudVisible ? 1 : 0)
      .setVisible(isHudVisible);
    this.fitImageInBox(this.missStickerImage, missWidth, missHeight);

    this.feverBadgeImage
      ?.setPosition(width - 58 * scale, 116 * scale)
      .setAlpha(this.feverActive ? 0.96 : 0)
      .setVisible(this.feverActive);
    this.fitImageInBox(this.feverBadgeImage, 72 * scale, 78 * scale);
  }

  private drawSticker(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    radius: number
  ) {
    graphics.fillStyle(this.themeColor("shadow"), 0.14);
    graphics.fillRoundedRect(x + 3 * this.screenScale, y + 4 * this.screenScale, width, height, radius);
    graphics.fillStyle(this.themeColor("line"), 0.92);
    graphics.fillRoundedRect(x, y, width, height, radius);
    graphics.lineStyle(3 * this.screenScale, color, 0.92);
    graphics.strokeRoundedRect(x, y, width, height, radius);
  }

  private fillGraphicsStar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    points: number,
    innerRadius: number,
    outerRadius: number
  ) {
    const starPoints = Array.from({ length: points * 2 }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / points;
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      return new Phaser.Math.Vector2(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    });

    graphics.fillPoints(starPoints, true);
  }

  private layoutDifficultyButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const titleWidth = Math.min(width * 0.75, 470 * Math.max(screenScale, 0.9));
    const titleHeight = titleWidth * 0.6;
    const titleLayoutHeight = titleWidth * 0.36;
    const titleY = height * (this.isPortrait ? 0.19 : 0.17);
    const totalWidth = Math.min(width * 0.9, 390 * Math.max(screenScale, 0.9));
    const gap = 10 * screenScale;
    const buttonWidth = (totalWidth - gap * 2) / 3;
    const buttonHeight = 104 * Math.max(screenScale, 0.9);
    const desiredCenterY = height * (this.isPortrait ? 0.47 : 0.49);
    const minCenterY = titleY + titleLayoutHeight * 0.5 + buttonHeight * 1.15;
    const maxCenterY = height - buttonHeight * 2.3;
    const centerY = Phaser.Math.Clamp(desiredCenterY, minCenterY, maxCenterY);
    const startX = width / 2 - totalWidth / 2 + buttonWidth / 2;
    const isSelectable = !this.gameStarted && !this.gameEnded && this.menuStep === "difficulty";

    this.difficultyTitleImage
      ?.setPosition(width / 2, titleY)
      .setAlpha(isSelectable ? 0.98 : 0)
      .setVisible(isSelectable);
    this.fitImageInBox(this.difficultyTitleImage, titleWidth, titleHeight);

    this.difficultyButtons.forEach((button, index) => {
      const selected = button.id === this.selectedDifficulty;
      const x = startX + index * (buttonWidth + gap);
      const fillColor = selected ? this.themeColor("accent") : this.themeColor("trackAlt");
      const strokeColor = selected ? this.themeColor("line") : this.themeColor("primary");

      button.background
        .setPosition(x, centerY)
        .setSize(buttonWidth, buttonHeight)
        .setFillStyle(fillColor, button.assetImage ? 0 : selected ? 1 : 0.92)
        .setStrokeStyle(2 * screenScale, strokeColor, button.assetImage ? 0 : selected ? 0.95 : 0.65)
        .setAlpha(isSelectable ? 1 : 0);

      button.assetImage
        ?.setPosition(x, centerY)
        .setAlpha(isSelectable && !selected ? 0.92 : 0)
        .setVisible(isSelectable);
      this.fitImageInBox(button.assetImage, buttonWidth * 1.35, buttonHeight * 2.05);
      button.selectedAssetImage
        ?.setPosition(x, centerY)
        .setAlpha(isSelectable && selected ? 1 : 0)
        .setVisible(isSelectable);
      this.fitImageInBox(button.selectedAssetImage, buttonWidth * 1.5, buttonHeight * 2.28);

      button.label
        .setPosition(x, centerY)
        .setFontSize(Math.round(Phaser.Math.Clamp(17 * screenScale, 14, 24)))
        .setAlpha(0);
    });
  }

  private layoutSongButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const theme = this.currentTheme;
    const isSelectable = !this.gameStarted && !this.gameEnded && this.menuStep === "song";
    const isTitleVisible = !this.gameStarted && !this.gameEnded && this.menuStep === "song";
    const centerX = width / 2;
    const titleWidth = Math.min(width * 0.75, 470 * Math.max(screenScale, 0.9));
    const titleHeight = titleWidth * 0.6;
    const titleLayoutHeight = titleWidth * 0.36;
    const titleY = height * (this.isPortrait ? 0.18 : 0.16);
    const cardWidth = this.isPortrait ? Math.min(width * 0.56, 250) : Math.min(width * 0.26, 270);
    const cardHeight = cardWidth * (806 / 450);
    const sideWidth = cardWidth * 0.58;
    const sideHeight = sideWidth * (806 / 450);
    const desiredCardY = height * (this.isPortrait ? 0.53 : 0.53);
    const minCardY = titleY + titleLayoutHeight * 0.5 + cardHeight * 0.52 + 18 * screenScale;
    const maxCardY = height - cardHeight * 0.58 - 58 * screenScale;
    const cardY = Phaser.Math.Clamp(desiredCardY, minCardY, maxCardY);
    const sideOffsetX = Math.min(width * 0.28, cardWidth * 0.72);
    const sideY = cardY + cardHeight * 0.02;
    const arrowSize = Math.round(Phaser.Math.Clamp(72 * Math.max(screenScale, 0.86), 62, 86));
    const arrowY = cardY;
    const arrowOffsetX = Math.min(width * 0.43, cardWidth * 0.98);
    const currentIndex = this.selectedSongIndex;
    const previousIndex = (currentIndex - 1 + SONGS.length) % SONGS.length;
    const nextIndex = (currentIndex + 1) % SONGS.length;

    this.songSelectTitleImage
      ?.setPosition(centerX, titleY)
      .setAlpha(isTitleVisible ? 0.98 : 0)
      .setVisible(isTitleVisible);
    this.fitImageInBox(this.songSelectTitleImage, titleWidth, titleHeight);

    this.songSelectPaginationImage
      ?.setPosition(centerX, cardY + cardHeight * 0.53)
      .setAlpha(isSelectable ? 0.78 : 0)
      .setVisible(isSelectable);
    this.fitImageInBox(this.songSelectPaginationImage, Math.min(width * 0.46, 210 * Math.max(screenScale, 0.85)), 40 * Math.max(screenScale, 0.85));

    this.songArrowButtons.forEach((arrow) => {
      const x = centerX + arrow.direction * arrowOffsetX;

      arrow.background
        .setPosition(x, arrowY)
        .setSize(arrowSize, arrowSize)
        .setAlpha(isSelectable ? 1 : 0);
      arrow.assetImage
        ?.setPosition(x, arrowY)
        .setAlpha(isSelectable ? 0.98 : 0)
        .setVisible(isSelectable);
      this.fitImageInBox(arrow.assetImage, arrowSize, arrowSize);
      arrow.pressedAssetImage
        ?.setPosition(x, arrowY)
        .setAlpha(0)
        .setVisible(isSelectable);
      this.fitImageInBox(arrow.pressedAssetImage, arrowSize, arrowSize);
    });

    this.songButtons.forEach((button, index) => {
      const selected = index === this.selectedSongIndex;
      const isPrevious = index === previousIndex && !selected;
      const isNext = index === nextIndex && !selected;
      const isVisible = isSelectable && (selected || isPrevious || isNext);
      const x = selected ? centerX : isPrevious ? centerX - sideOffsetX : centerX + sideOffsetX;
      const y = selected ? cardY : sideY;
      const buttonWidth = selected ? cardWidth : sideWidth;
      const buttonHeight = selected ? cardHeight : sideHeight;
      const buttonTheme = THEMES[button.song.themeId] ?? DEFAULT_THEME;
      const fillColor = selected ? toColorNumber(buttonTheme.colors.secondary) : toColorNumber(buttonTheme.colors.trackAlt);
      const strokeColor = selected ? this.themeColor("line") : toColorNumber(buttonTheme.colors.primary);
      const textColor = theme.colors.text;
      const titleText = this.getSongCardTitle(button.song.title, selected);
      const indexText = String(index + 1).padStart(2, "0");
      const titleSize = Math.round(Phaser.Math.Clamp((selected ? 24 : 13) * Math.max(screenScale, 0.9), selected ? 20 : 11, selected ? 32 : 16));
      const indexSize = Math.round(Phaser.Math.Clamp((selected ? 22 : 13) * Math.max(screenScale, 0.9), selected ? 18 : 11, selected ? 30 : 16));
      const metaSize = Math.round(Phaser.Math.Clamp((selected ? 13 : 9) * Math.max(screenScale, 0.9), selected ? 11 : 8, selected ? 18 : 12));

      button.background
        .setPosition(x, y)
        .setSize(buttonWidth, buttonHeight)
        .setFillStyle(fillColor, button.assetImage ? 0 : selected ? 1 : 0.92)
        .setStrokeStyle(2 * screenScale, strokeColor, button.assetImage ? 0 : selected ? 0.95 : 0.65)
        .setAlpha(isVisible ? 1 : 0);

      button.assetImage
        ?.setPosition(x, y)
        .setAlpha(isVisible && selected ? 0.98 : 0)
        .setVisible(isVisible && selected);
      this.fitImageInBox(button.assetImage, cardWidth, cardHeight);

      button.sideAssetImage
        ?.setPosition(x, y)
        .setAlpha(isVisible && !selected ? 0.78 : 0)
        .setVisible(isVisible && !selected);
      this.fitImageInBox(button.sideAssetImage, sideWidth, sideHeight);

      button.thumbnailMaskGraphics
        .clear()
        .fillStyle(0xffffff, 1)
        .fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);

      button.thumbnail
        .setOrigin(0.5)
        .setPosition(x, y - buttonHeight * (selected ? 0.07 : 0.05))
        .setSize(buttonWidth * (selected ? 0.76 : 0.7), buttonHeight * (selected ? 0.68 : 0.62))
        .setFillStyle(toColorNumber(buttonTheme.colors.primary), selected ? 0.86 : 0.58)
        .setAlpha(isVisible ? 1 : 0);

      button.thumbnailAccent
        .setOrigin(0.5)
        .setPosition(x + buttonWidth * 0.14, y + buttonHeight * (selected ? 0.12 : 0.12))
        .setSize(buttonWidth * (selected ? 0.26 : 0.2), buttonHeight * 0.05)
        .setFillStyle(toColorNumber(buttonTheme.colors.accent), selected ? 0.92 : 0.55)
        .setAlpha(isVisible ? 1 : 0);

      button.indexLabel
        .setPosition(x - buttonWidth * (selected ? 0.39 : 0.34), y - buttonHeight * (selected ? 0.4 : 0.34))
        .setFontSize(indexSize)
        .setText(indexText)
        .setColor(buttonTheme.colors.primary)
        .setAlpha(isVisible ? 1 : 0);

      button.label
        .setPosition(x - buttonWidth * (selected ? 0.3 : 0.29), y - buttonHeight * (selected ? 0.18 : 0.14))
        .setOrigin(0, 0.5)
        .setFontSize(titleSize)
        .setText(titleText)
        .setColor(textColor)
        .setStroke("#fffaf0", selected ? 3 : 1)
        .setAlpha(isVisible ? 1 : 0);

      button.metaLabel
        .setPosition(x - buttonWidth * (selected ? 0.36 : 0.32), y + buttonHeight * (selected ? 0.31 : 0.31))
        .setFontSize(metaSize)
        .setText(`BPM ${Math.round(button.song.bpm)}`)
        .setColor(textColor)
        .setAlpha(isVisible ? 0.92 : 0);

      button.starLabel
        .setPosition(x - buttonWidth * (selected ? 0.36 : 0.32), y + buttonHeight * (selected ? 0.41 : 0.39))
        .setText(this.getSongCardStars(index))
        .setColor(buttonTheme.colors.accent)
        .setAlpha(0);
    });
  }

  private getSongCardTitle(title: string, isSelected: boolean) {
    if (!isSelected) {
      return title.split(" ").slice(0, 2).join("\n");
    }

    const words = title.split(" ");
    if (words.length <= 2) {
      return title;
    }

    return `${words.slice(0, 2).join(" ")}\n${words.slice(2).join(" ")}`;
  }

  private getSongCardStars(index: number) {
    const filledStars = Phaser.Math.Clamp(3 + (index % 2), 3, 4);
    return Array.from({ length: 5 }, (_, starIndex) => (starIndex < filledStars ? "★" : "☆")).join(" ");
  }

  private layoutDebugButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const isVisible = false;
    const buttonSize = 34 * Math.max(screenScale, 0.82);
    const labelWidth = Math.min(width * 0.46, 220 * Math.max(screenScale, 0.82));
    const gap = 6 * Math.max(screenScale, 0.82);
    const centerX = width / 2;
    const startY = height * (this.isPortrait ? 0.5 : 0.5);
    const rowGap = (this.isPortrait ? 31 : 28) * Math.max(screenScale, 0.82);
    const textSize = Math.round(Phaser.Math.Clamp(13 * Math.max(screenScale, 0.82), 11, 18));
    const rows: Array<{ actions: [DebugAction, DebugAction]; label: string; y: number; labelObject?: Phaser.GameObjects.Text }> = [
      {
        actions: ["trackYDown", "trackYUp"],
        label: `TRACK Y ${this.layoutDebug.trackY}`,
        y: startY,
        labelObject: this.debugLayoutLabels[0]
      },
      {
        actions: ["farYDown", "farYUp"],
        label: `FAR Y ${this.layoutDebug.farY}`,
        y: startY + rowGap,
        labelObject: this.debugLayoutLabels[1]
      },
      {
        actions: ["farWDown", "farWUp"],
        label: `FAR W ${this.layoutDebug.farW}`,
        y: startY + rowGap * 2,
        labelObject: this.debugLayoutLabels[2]
      },
      {
        actions: ["nearWDown", "nearWUp"],
        label: `NEAR W ${this.layoutDebug.nearW}`,
        y: startY + rowGap * 3,
        labelObject: this.debugLayoutLabels[3]
      },
      {
        actions: ["bgYDown", "bgYUp"],
        label: `BG Y ${this.layoutDebug.bgY}`,
        y: startY + rowGap * 4,
        labelObject: this.debugLayoutLabels[4]
      },
      {
        actions: ["bgScaleDown", "bgScaleUp"],
        label: `BG SCALE ${this.layoutDebug.bgScale}`,
        y: startY + rowGap * 5,
        labelObject: this.debugLayoutLabels[5]
      }
    ];

    this.debugButtons.forEach((button) => {
      button.background.setAlpha(0);
      button.label.setAlpha(0);
    });
    this.debugDensityLabel?.setAlpha(0);
    this.debugSpeedLabel?.setAlpha(0);
    this.debugLayoutLabels.forEach((label) => label.setAlpha(0));

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
      row.labelObject
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
      .setFillStyle(this.themeColor("surface"), 0.95)
      .setStrokeStyle(2 * this.screenScale, this.themeColor("primary"), 0.75)
      .setAlpha(isVisible ? 1 : 0);
    button.label
      .setPosition(x, y)
      .setText(text)
      .setFontSize(textSize)
      .setAlpha(isVisible ? 1 : 0);
  }

  private drawMenuBackground() {
    const graphics = this.trackGraphics;
    if (!graphics) {
      return;
    }

    if (!this.gameStarted && !this.gameEnded) {
      graphics.clear();
      graphics.setAlpha(1);
      return;
    }

    const { width, height } = this.scale;
    const theme = this.currentTheme;
    const isSongMenu = this.menuStep === "song";
    const shelfY = height * (this.isPortrait ? 0.69 : 0.66);
    const roadY = height * (this.isPortrait ? 0.38 : 0.4);
    const toyScale = this.screenScale;
    graphics.clear();
    graphics.setAlpha(1);
    graphics.fillStyle(isSongMenu ? 0xfff3d8 : this.themeColor("background"), this.deskSurfaceImage ? 0.12 : 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(isSongMenu ? 0xfff3d8 : this.themeColor("surface"), isSongMenu ? 0.34 : this.deskSurfaceImage ? 0.72 : 1);
    graphics.fillEllipse(width / 2, shelfY, width * (this.isPortrait ? 1.25 : 0.78), height * 0.18);

    graphics.fillStyle(isSongMenu ? 0xf7dfac : this.themeColor("track"), isSongMenu ? 0.38 : this.toyRoadImage ? 0.72 : 1);
    graphics.fillRoundedRect(width * 0.18, roadY - 36 * toyScale, width * 0.64, 72 * toyScale, 18 * toyScale);
    graphics.fillStyle(isSongMenu ? 0xffffff : this.themeColor("line"), isSongMenu ? 0.48 : 0.78);
    graphics.fillRect(width * 0.24, roadY - 4 * toyScale, width * 0.52, 8 * toyScale);

    const blockY = height * (this.isPortrait ? 0.18 : 0.22);
    this.drawToyBlock(graphics, width * 0.18, blockY, 38 * toyScale, this.themeColor("primary"));
    this.drawToyBlock(graphics, width * 0.78, blockY + 22 * toyScale, 34 * toyScale, this.themeColor("centerLane"));
    this.drawToyBlock(graphics, width * 0.28, shelfY - 42 * toyScale, 30 * toyScale, this.themeColor("rightLane"));
    this.drawMiniCar(graphics, width * 0.72, shelfY - 28 * toyScale, toyScale);

    graphics.fillStyle(toColorNumber(theme.colors.shadow), 0.1);
    graphics.fillRoundedRect(width * 0.12, height * 0.88, width * 0.76, 10 * toyScale, 5 * toyScale);
  }

  private drawToyBlock(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number) {
    graphics.fillStyle(this.themeColor("shadow"), 0.16);
    graphics.fillRoundedRect(x + size * 0.12, y + size * 0.16, size, size, size * 0.14);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x, y, size, size, size * 0.14);
    graphics.fillStyle(this.themeColor("line"), 0.75);
    graphics.fillCircle(x + size * 0.32, y + size * 0.32, size * 0.09);
    graphics.fillCircle(x + size * 0.68, y + size * 0.32, size * 0.09);
  }

  private drawMiniCar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    graphics.fillStyle(this.themeColor("shadow"), 0.16);
    graphics.fillEllipse(x, y + 18 * scale, 74 * scale, 16 * scale);
    graphics.fillStyle(this.themeColor("primary"), 1);
    graphics.fillRoundedRect(x - 34 * scale, y - 10 * scale, 68 * scale, 26 * scale, 8 * scale);
    graphics.fillStyle(this.themeColor("rightLane"), 1);
    graphics.fillRoundedRect(x - 14 * scale, y - 24 * scale, 28 * scale, 18 * scale, 6 * scale);
    graphics.fillStyle(this.themeColor("text"), 1);
    graphics.fillCircle(x - 22 * scale, y + 18 * scale, 7 * scale);
    graphics.fillCircle(x + 22 * scale, y + 18 * scale, 7 * scale);
  }

  private setRunnersVisible(visible: boolean) {
    this.runners.forEach((runner) => {
      runner.container.setAlpha(visible ? 1 : 0);
    });
  }

  private layoutJumpButtons() {
    const { width, height } = this.scale;
    const screenScale = this.screenScale;
    const buttonSize = Phaser.Math.Clamp(width * 0.38, 132 * screenScale, 190 * screenScale);
    const track = this.getTrackLayout();
    const runnerScreenScale = Math.max(screenScale, this.isPortrait ? RUNNER_MIN_SCREEN_SCALE : screenScale);
    const playerScale = Phaser.Math.Linear(0.45, 1.16, GAME_BALANCE.playerZ) * runnerScreenScale;
    const runnerBottomOffset = (RUNNER_DISPLAY_HEIGHT * playerScale) / 2;
    const maxButtonY = height - buttonSize * 0.52;
    const isVisible = this.gameStarted;

    this.jumpButtons.forEach((button, index) => {
      const playerPoint = this.getLaneCenterPoint(track, index, GAME_BALANCE.playerZ);
      const x = playerPoint.x;
      const centerY = Math.min(playerPoint.y + runnerBottomOffset + buttonSize * 0.5 + 8 * screenScale, maxButtonY);

      button.background
        .setPosition(x, centerY)
        .setSize(buttonSize, buttonSize)
        .setFillStyle(this.themeColor("trackAlt"), 0.01)
        .setStrokeStyle(0, this.runnerColor(index), 0)
        .setAlpha(isVisible ? 0.01 : 0);
      button.assetImage
        ?.setPosition(x, centerY)
        .setAlpha(isVisible ? 0.95 : 0)
        .setVisible(isVisible);
      this.fitImageInBox(button.assetImage, buttonSize, buttonSize);
      button.pressedAssetImage
        ?.setPosition(x, centerY)
        .setAlpha(0)
        .setVisible(isVisible);
      this.fitImageInBox(button.pressedAssetImage, buttonSize, buttonSize);
      button.label
        .setPosition(x, centerY)
        .setFontSize(Math.round(Phaser.Math.Clamp(16 * screenScale, 13, 24)))
        .setAlpha(0);
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.layout();
  }

  private tryPressMenuButton(x: number, y: number) {
    const targetButton = this.menuButtons.find((button) => {
      const isActive =
        (this.menuStep === "start" && (button.action === "play" || button.action === "ranking" || button.action === "setting" || button.action === "help")) ||
        (this.menuStep === "song" && button.action === "setting") ||
        (this.menuStep === "difficulty" && (button.action === "play" || button.action === "back" || button.action === "setting")) ||
        (this.menuStep === "ranking" && button.action === "back");

      return isActive && button.background.getBounds().contains(x, y);
    });
    if (!targetButton) {
      return false;
    }

    if (this.menuStep === "start" && targetButton.action === "play") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showSongSelect());
      return true;
    }

    if (this.menuStep === "start" && targetButton.action === "ranking") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showRankingScreen());
      return true;
    }

    if (this.menuStep === "start" && targetButton.action === "setting") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.popFeedback("SETTING SOON", this.currentTheme.colors.secondary));
      return true;
    }

    if (this.menuStep === "start" && targetButton.action === "help") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.popFeedback("HELP SOON", this.currentTheme.colors.accent));
      return true;
    }

    if (this.menuStep === "difficulty" && targetButton.action === "play") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.startRun());
      return true;
    }

    if (this.menuStep === "difficulty" && targetButton.action === "setting") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.popFeedback("SETTING SOON", this.currentTheme.colors.secondary));
      return true;
    }

    if (this.menuStep === "song" && targetButton.action === "setting") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.popFeedback("SETTING SOON", this.currentTheme.colors.secondary));
      return true;
    }

    if (this.menuStep === "difficulty" && targetButton.action === "back") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showSongSelect());
      return true;
    }

    if (this.menuStep === "ranking" && targetButton.action === "back") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showStartScreen());
      return true;
    }

    return false;
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
    const targetButton = this.debugButtons.find((button) => button.background.alpha > 0 && button.background.getBounds().contains(x, y));
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
      this.popFeedback(`DENSITY ${Math.round(this.debugDensityFactor * 100)}%`, this.currentTheme.colors.accent);
      this.layout();
      return;
    }

    if (action === "speedDown" || action === "speedUp") {
      const delta = action === "speedDown" ? -1 : 1;
      this.debugSpeedLevel = Phaser.Math.Clamp(this.debugSpeedLevel + delta, -4, 8);
      this.popFeedback(`SPEED ${Math.round(this.debugSpeedFactor * 100)}%`, this.currentTheme.colors.secondary);
      this.layout();
      return;
    }

    this.adjustLayoutDebug(action);
  }

  private adjustLayoutDebug(action: DebugAction) {
    const delta = action.endsWith("Down") ? -1 : 1;

    if (action === "trackYDown" || action === "trackYUp") {
      this.layoutDebug.trackY = Phaser.Math.Clamp(this.layoutDebug.trackY + delta, -16, 16);
    }

    if (action === "farYDown" || action === "farYUp") {
      this.layoutDebug.farY = Phaser.Math.Clamp(this.layoutDebug.farY + delta, -16, 16);
    }

    if (action === "farWDown" || action === "farWUp") {
      this.layoutDebug.farW = Phaser.Math.Clamp(this.layoutDebug.farW + delta, -12, 18);
    }

    if (action === "nearWDown" || action === "nearWUp") {
      this.layoutDebug.nearW = Phaser.Math.Clamp(this.layoutDebug.nearW + delta, -12, 18);
    }

    if (action === "bgYDown" || action === "bgYUp") {
      this.layoutDebug.bgY = Phaser.Math.Clamp(this.layoutDebug.bgY + delta, -18, 18);
    }

    if (action === "bgScaleDown" || action === "bgScaleUp") {
      this.layoutDebug.bgScale = Phaser.Math.Clamp(this.layoutDebug.bgScale + delta, -10, 20);
    }

    this.saveLayoutDebug();
    this.popFeedback(this.getLayoutDebugSummary(), this.currentTheme.colors.accent);
    this.layout();
  }

  private selectDifficulty(difficulty: DifficultyId) {
    this.selectedDifficulty = difficulty;
    this.rebuildDifficultyChart();
    this.popFeedback(DIFFICULTY_SETTINGS[difficulty].label, this.currentTheme.colors.secondary);
    this.layout();
  }

  private runAfterPressedAssetFeedback(
    button: { background: Phaser.GameObjects.Rectangle; assetImage?: Phaser.GameObjects.Image; pressedAssetImage?: Phaser.GameObjects.Image },
    action: () => void
  ) {
    if (!this.showPressedAssetFeedback(button)) {
      action();
      return;
    }

    this.time.delayedCall(120, action);
  }

  private showPressedAssetFeedback(button: { background: Phaser.GameObjects.Rectangle; assetImage?: Phaser.GameObjects.Image; pressedAssetImage?: Phaser.GameObjects.Image }) {
    if (!button.assetImage || !button.pressedAssetImage) {
      return false;
    }

    const normalAlpha = button.assetImage.alpha;
    this.tweens.killTweensOf([button.assetImage, button.pressedAssetImage]);
    button.assetImage.setAlpha(0);
    button.pressedAssetImage.setAlpha(normalAlpha > 0 ? normalAlpha : 0.95).setVisible(true);
    this.time.delayedCall(120, () => {
      button.pressedAssetImage?.setAlpha(0);
      if (button.background.alpha > 0) {
        button.assetImage?.setAlpha(normalAlpha > 0 ? normalAlpha : 0.95);
      }
    });
    return true;
  }

  private trySelectSong(x: number, y: number) {
    const targetArrow = this.songArrowButtons.find((button) => button.background.getBounds().contains(x, y));
    if (targetArrow) {
      this.runAfterPressedAssetFeedback(targetArrow, () => this.browseSongByOffset(targetArrow.direction));
      return true;
    }

    const targetIndex = this.songButtons.findIndex((button) => button.background.getBounds().contains(x, y));
    if (targetIndex < 0) {
      return false;
    }

    if (targetIndex !== this.selectedSongIndex) {
      this.browseSong(targetIndex);
      return true;
    }

    this.selectSong(targetIndex);
    return true;
  }

  private browseSongByOffset(offset: number) {
    this.browseSong((this.selectedSongIndex + offset + SONGS.length) % SONGS.length);
  }

  private browseSong(index: number) {
    const changedSong = this.selectedSongIndex !== index;

    this.selectedSongIndex = index;
    if (changedSong) {
      this.createSelectedBgm();
      this.loadChart();
      this.popFeedback(this.selectedSong.shortTitle, this.currentTheme.colors.secondary);
    }
    this.layout();
  }

  private selectSong(index: number) {
    const changedSong = this.selectedSongIndex !== index;

    this.selectedSongIndex = index;
    if (changedSong) {
      this.createSelectedBgm();
      this.loadChart();
    }
    this.showDifficultySelect();
    this.popFeedback(this.selectedSong.shortTitle, this.currentTheme.colors.secondary);
    this.layout();
  }

  private showDifficultySelect() {
    this.gameEnded = false;
    this.menuStep = "difficulty";
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
  }

  private showStartScreen() {
    this.gameEnded = false;
    this.menuStep = "start";
    this.resetRunState();
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
  }

  private showRankingScreen() {
    this.gameEnded = false;
    this.menuStep = "ranking";
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
  }

  private showSongSelect() {
    this.gameEnded = false;
    this.menuStep = "song";
    this.resetRunState();
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
  }

  private resetRunState() {
    this.score = 0;
    this.avoidCount = 0;
    this.combo = 0;
    this.missCount = 0;
    this.maxCombo = 0;
    this.runners.forEach((runner) => {
      runner.isJumping = false;
      runner.container.y = 0;
    });
    this.lastMissEffectAt = 0;
    this.lastLayoutRefreshAt = 0;
    this.setFeverActive(false);
    this.clearObstacles();
    this.clearItems();
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
    const trackYOffset = height * this.layoutDebug.trackY * 0.01;
    const farYOffset = height * this.layoutDebug.farY * 0.01;
    const farWidthScale = 1 + this.layoutDebug.farW * 0.035;
    const nearWidthScale = (1 + this.layoutDebug.nearW * 0.035) * (this.gameStarted ? (this.isPortrait ? 1.38 : 1.22) : 1);

    const topY = height * GAME_BALANCE.trackTopYRatio[mode] + trackYOffset + farYOffset;
    const baseBottomY = height * GAME_BALANCE.trackBottomYRatio[mode] + trackYOffset;
    const bottomY = this.gameStarted ? Math.max(baseBottomY, height * (this.isPortrait ? 1.06 : 1.04)) : baseBottomY;

    return {
      centerX: width / 2,
      topY,
      bottomY,
      topWidth: Phaser.Math.Clamp(width * GAME_BALANCE.trackTopWidthRatio[mode] * farWidthScale, width * 0.08, width * 0.52),
      bottomWidth: Phaser.Math.Clamp(width * GAME_BALANCE.trackBottomWidthRatio[mode] * nearWidthScale, width * 0.5, width * (this.gameStarted ? 1.48 : 1.08))
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
    this.drawLaneCenterDashes(graphics, track);
    this.drawLaneEdgeHighlights(graphics, track);
  }

  private drawBackdrop(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const { width, height } = this.scale;

    graphics.fillStyle(this.feverActive ? this.themeColor("accent") : this.themeColor("background"), this.deskSurfaceImage ? 0.12 : 1);
    graphics.fillRect(0, 0, width, height);

    graphics.fillStyle(this.themeColor("surface"), this.deskSurfaceImage ? 0.62 : 1);
    graphics.fillRect(0, track.bottomY, width, height - track.bottomY);
  }

  private drawFeverLayer() {
    const graphics = this.feverGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    if (!this.feverActive) {
      return;
    }

    const { width, height } = this.scale;
    const scale = this.screenScale;
    const pulse = this.feverPulse;

    graphics.fillStyle(this.themeColor("line"), 0.12 + pulse * 0.08);
    graphics.fillRect(0, 0, width, height);

    for (let index = 0; index < 18; index += 1) {
      const x = ((index * 73 + this.time.now / 8) % (width + 80 * scale)) - 40 * scale;
      const y = (index % 6) * height * 0.14 + 62 * scale;
      const color = index % 2 === 0 ? this.themeColor("accent") : this.themeColor("secondary");
      graphics.fillStyle(color, 0.45);
      if (index % 3 === 0) {
        this.fillGraphicsStar(graphics, x, y, 5, 4 * scale, 10 * scale);
      } else {
        graphics.fillCircle(x, y, 5 * scale);
        graphics.fillRect(x + 4 * scale, y - 14 * scale, 4 * scale, 16 * scale);
      }
    }

    for (let index = 0; index < 7; index += 1) {
      const y = height * (0.18 + index * 0.1);
      const x = ((this.time.now / 5 + index * 54) % (width + 120 * scale)) - 60 * scale;
      graphics.lineStyle(4 * scale, index % 2 === 0 ? this.themeColor("line") : this.themeColor("accent"), 0.18);
      graphics.beginPath();
      graphics.moveTo(x, y);
      graphics.lineTo(x + 58 * scale, y - 20 * scale);
      graphics.strokePath();
    }
  }

  private drawWorldProps(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const { width, height } = this.scale;
    const scale = this.screenScale;
    const deskY = track.bottomY + 24 * scale;

    this.drawToyBlock(graphics, width * 0.08, deskY + 24 * scale, 24 * scale, this.themeColor("leftLane"));
    this.drawToyBlock(graphics, width * 0.88, deskY + 10 * scale, 28 * scale, this.themeColor("centerLane"));
    this.drawMiniCar(graphics, width * 0.84, height * 0.22, scale * 0.62);

    graphics.fillStyle(this.themeColor("accent"), 1);
    graphics.fillTriangle(width * 0.18, height * 0.2, width * 0.24, height * 0.17, width * 0.24, height * 0.23);
    graphics.fillStyle(this.themeColor("text"), 0.65);
    graphics.fillRect(width * 0.24, height * 0.17, 4 * scale, 56 * scale);
  }

  private drawLaneSurfaces(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const bottomLeft = this.getLaneBoundaryPoint(track, 0, 1);
    const bottomRight = this.getLaneBoundaryPoint(track, GAME_BALANCE.laneCount, 1);
    const scale = this.screenScale;

    graphics.fillStyle(this.themeColor("shadow"), 0.06);
    graphics.fillEllipse(track.centerX, bottomLeft.y + 18 * scale, bottomRight.x - bottomLeft.x, 42 * scale);
  }

  private drawDepthLines(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const lineCount = 11;
    const spacing = 1 / lineCount;
    const offset = this.getTrackScrollOffset(spacing);

    for (let index = 0; index <= lineCount; index += 1) {
      const z = (index * spacing + offset) % 1;
      const left = this.getLaneBoundaryPoint(track, 0, z);
      const right = this.getLaneBoundaryPoint(track, GAME_BALANCE.laneCount, z);
      const lineWidth = Phaser.Math.Linear(1, 5, z) * this.screenScale;

      graphics.lineStyle(
        lineWidth,
        this.feverActive ? this.themeColor("accent") : this.themeColor("line"),
        Phaser.Math.Linear(this.feverActive ? 0.22 : 0.12, this.feverActive ? 0.72 : 0.5, z)
      );
      graphics.beginPath();
      graphics.moveTo(left.x, left.y);
      graphics.lineTo(right.x, right.y);
      graphics.strokePath();

      if (index % 2 === 0 && z > 0.12) {
        this.drawLaneGuideArrow(graphics, track, z);
      }
    }
  }

  private drawMovingSideProps(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const scale = this.screenScale;
    const spacing = 1 / 7;
    const offset = this.getTrackScrollOffset(spacing);

    for (let index = 0; index < 8; index += 1) {
      const z = (index * spacing + offset) % 1;
      if (z < 0.08) {
        continue;
      }

      const leftEdge = this.getLaneBoundaryPoint(track, 0, z);
      const rightEdge = this.getLaneBoundaryPoint(track, GAME_BALANCE.laneCount, z);
      const propScale = Phaser.Math.Linear(0.22, 1.05, z) * scale;
      const sideOffset = Phaser.Math.Linear(10, 34, z) * scale;
      const alpha = Phaser.Math.Linear(0.08, 0.24, z);
      const color = index % 3 === 0 ? this.themeColor("accent") : index % 3 === 1 ? this.themeColor("centerLane") : this.themeColor("rightLane");
      const y = leftEdge.y + 3 * propScale;

      graphics.fillStyle(this.themeColor("shadow"), alpha * 0.5);
      graphics.fillEllipse(leftEdge.x - sideOffset, y + 8 * propScale, 32 * propScale, 10 * propScale);
      graphics.fillEllipse(rightEdge.x + sideOffset, y + 8 * propScale, 32 * propScale, 10 * propScale);
      graphics.fillStyle(color, alpha);
      graphics.fillRoundedRect(leftEdge.x - sideOffset - 10 * propScale, y - 8 * propScale, 20 * propScale, 16 * propScale, 4 * propScale);
      graphics.fillRoundedRect(rightEdge.x + sideOffset - 10 * propScale, y - 8 * propScale, 20 * propScale, 16 * propScale, 4 * propScale);
    }
  }

  private drawLaneGuideArrow(graphics: Phaser.GameObjects.Graphics, track: TrackLayout, z: number) {
    const arrowY = this.getLaneCenterPoint(track, 1, z).y;
    const arrowScale = Phaser.Math.Linear(0.2, 1, z) * this.screenScale;
    const alpha = Phaser.Math.Linear(0.15, 0.42, z);

    for (let lane = 0; lane < GAME_BALANCE.laneCount; lane += 1) {
      const point = this.getLaneCenterPoint(track, lane, z);
      const color = lane === 0 ? this.themeColor("leftLane") : lane === 1 ? this.themeColor("centerLane") : this.themeColor("rightLane");
      graphics.fillStyle(color, alpha);
      graphics.fillTriangle(
        point.x,
        arrowY + 9 * arrowScale,
        point.x - 10 * arrowScale,
        arrowY - 7 * arrowScale,
        point.x + 10 * arrowScale,
        arrowY - 7 * arrowScale
      );
    }
  }

  private drawLaneCenterDashes(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const dashCount = 12;
    const spacing = 1 / dashCount;
    const offset = 0;

    for (let lane = 0; lane < GAME_BALANCE.laneCount; lane += 1) {
      for (let index = 0; index < dashCount; index += 1) {
        const z = (index * spacing + offset) % 1;
        if (z < 0.05 || z > 0.96) {
          continue;
        }

        const dashLength = Phaser.Math.Linear(0.018, 0.048, z);
        const start = this.getLaneCenterPoint(track, lane, z);
        const end = this.getLaneCenterPoint(track, lane, Phaser.Math.Clamp(z + dashLength, 0, 1));
        const lineWidth = Phaser.Math.Linear(2, 7, z) * this.screenScale;

        graphics.lineStyle(lineWidth, 0xffffff, Phaser.Math.Linear(0.22, 0.7, z));
        graphics.beginPath();
        graphics.moveTo(start.x, start.y);
        graphics.lineTo(end.x, end.y);
        graphics.strokePath();
      }
    }
  }

  private drawLaneStartHaze(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const scale = this.screenScale;
    const hazeHeight = Math.max(74 * scale, (track.bottomY - track.topY) * 0.12);
    const centerY = track.topY + hazeHeight * 0.12;
    const baseWidth = Math.max(track.topWidth * 2.4, 170 * scale);

    for (let index = 0; index < 7; index += 1) {
      const progress = index / 6;
      const width = baseWidth * Phaser.Math.Linear(0.72, 1.58, progress);
      const height = hazeHeight * Phaser.Math.Linear(0.24, 0.62, progress);
      const y = centerY + progress * hazeHeight * 0.34;
      const alpha = Phaser.Math.Linear(0.24, 0.035, progress);

      graphics.fillStyle(this.themeColor("background"), alpha);
      graphics.fillEllipse(track.centerX, y, width, height);
    }

    graphics.fillStyle(this.themeColor("surface"), 0.12);
    graphics.fillEllipse(track.centerX, track.topY + hazeHeight * 0.42, baseWidth * 1.55, hazeHeight * 0.46);
  }

  private drawLaneEdgeHighlights(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    if (!this.feverActive) {
      return;
    }

    const pulse = this.feverPulse;
    for (let lane = 0; lane < GAME_BALANCE.laneCount; lane += 1) {
      const left = this.getLaneBoundaryPoint(track, lane, 0.1);
      const right = this.getLaneBoundaryPoint(track, lane + 1, 0.1);
      const bottomLeft = this.getLaneBoundaryPoint(track, lane, 0.96);
      const bottomRight = this.getLaneBoundaryPoint(track, lane + 1, 0.96);
      const color = lane === 0 ? this.themeColor("leftLane") : lane === 1 ? this.themeColor("centerLane") : this.themeColor("rightLane");

      graphics.lineStyle((5 + pulse * 3) * this.screenScale, color, 0.45 + pulse * 0.25);
      graphics.beginPath();
      graphics.moveTo((left.x + right.x) / 2, (left.y + right.y) / 2);
      graphics.lineTo((bottomLeft.x + bottomRight.x) / 2, (bottomLeft.y + bottomRight.y) / 2);
      graphics.strokePath();
    }
  }

  private layoutPlayers(track: TrackLayout) {
    const runnerScreenScale = Math.max(this.screenScale, this.isPortrait ? RUNNER_MIN_SCREEN_SCALE : this.screenScale);
    const playerScale = Phaser.Math.Linear(0.45, 1.16, GAME_BALANCE.playerZ) * runnerScreenScale;

    this.runners.forEach((runner) => {
      const playerPoint = this.getLaneCenterPoint(track, runner.lane, GAME_BALANCE.playerZ);

      runner.container.setX(playerPoint.x).setScale(playerScale).setAngle(runner.isJumping ? runner.container.angle : 0);
      if (!runner.isJumping) {
        runner.container.setY(playerPoint.y);
      }
      runner.body.setFillStyle(this.runnerColor(runner.lane), 1);
      runner.face.setFillStyle(this.themeColor("background"), 1);
      runner.shadow.setFillStyle(this.themeColor("shadow"), 0.32);
      runner.face.setScale(runner.isJumping ? 1.08 : 1, runner.isJumping ? 0.92 : 1);
      runner.assetImage?.setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT).setAlpha(1);
      runner.shadow.setScale(runner.isJumping ? 0.72 : 1, runner.isJumping ? 0.7 : 1);
      if (!runner.isJumping) {
        this.startRunnerIdleAnimation(runner);
      }
    });
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
    this.runners.forEach((runner) => {
      runner.isJumping = false;
    });
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

    this.popFeedback("GO", this.currentTheme.colors.accent);
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

    this.chartObstacles = this.createAuthoredScheduledChart(this.createSteadyDifficultyObstacles(chart));
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
        energy: obstacle.energy,
        visualType: this.getObstacleVisualType(index)
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

    let previousSafeLane = 1;

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
        energy,
        visualType: this.getObstacleVisualType(groupIndex + lane)
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
    this.gameEnded = false;
    this.menuStep = "ranking";
    this.bgm?.stop();
    this.clearObstacles();
    this.clearItems();
    this.saveRankingEntry(this.requestRankingName());
    this.resultLabel?.setAlpha(0);
    this.startLabel?.setAlpha(1).setScale(1);
    this.setFeverActive(false);
    this.layout();
  }

  private async loadRankings() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const response = await fetch(this.rankingApiPath, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { rankings?: RankingEntry[] };
      this.setRankings(payload.rankings);
      this.layout();
    } catch {
      this.rankings = [];
    }
  }

  private async saveRankingEntry(playerName: string) {
    const entry: RankingEntry = {
      playerName,
      song: this.selectedSong.shortTitle,
      difficulty: DIFFICULTY_SETTINGS[this.selectedDifficulty].label,
      score: this.score,
      avoidCount: this.avoidCount,
      maxCombo: this.maxCombo,
      missCount: this.missCount,
      createdAt: new Date().toISOString()
    };

    this.setRankings([...this.rankings, entry]);
    this.layout();

    if (typeof window === "undefined") {
      return;
    }

    try {
      const response = await fetch(this.rankingApiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { rankings?: RankingEntry[] };
      this.setRankings(payload.rankings);
      this.layout();
    } catch {
      // Ranking is optimistic locally; gameplay should never fail if the server is unavailable.
    }
  }

  private setRankings(rankings: RankingEntry[] | undefined) {
    this.rankings = Array.isArray(rankings)
      ? rankings
          .filter((entry) => typeof entry.score === "number" && typeof entry.song === "string")
          .map((entry) => ({
            ...entry,
            playerName: this.normalizePlayerName(entry.playerName)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
      : [];
  }

  private requestRankingName() {
    if (typeof window === "undefined") {
      return "PLAYER";
    }

    const previousName = window.localStorage.getItem("beat-runner-player-name") ?? "PLAYER";
    const playerName = this.normalizePlayerName(previousName);

    try {
      window.localStorage.setItem("beat-runner-player-name", playerName);
    } catch {
      // Keeping the latest name is optional.
    }

    return playerName;
  }

  private normalizePlayerName(name: unknown) {
    if (typeof name !== "string") {
      return "PLAYER";
    }

    const normalizedName = name.trim().replace(/\s+/g, " ").slice(0, 10);
    return normalizedName || "PLAYER";
  }

  private spawnObstacle(chartObstacle: ScheduledObstacle) {
    const shadow = this.add.ellipse(0, 18, 54, 16, this.themeColor("shadow"), 0.28);
    const body = this.add.rectangle(0, 0, GAME_BALANCE.obstacleBaseWidth, GAME_BALANCE.obstacleBaseHeight, this.themeColor("obstacle"), 1);
    const shine = this.add.rectangle(-10, -8, GAME_BALANCE.obstacleBaseWidth * 0.42, 6, this.themeColor("obstacleAccent"), 0.9);
    const details = this.createObstacleDetails(chartObstacle.visualType);
    const cueItemType = this.getPerformanceCueItemType(chartObstacle.lane);
    const assetImage = this.createThemeImage(this.currentThemeAssets.items[cueItemType], 0, 0, 1);
    const containerChildren: Phaser.GameObjects.GameObject[] = assetImage
      ? [shadow, body, shine, ...details, assetImage]
      : [shadow, body, shine, ...details];
    const container = this.add.container(0, 0, containerChildren);
    if (assetImage) {
      body.setAlpha(0);
      shine.setAlpha(0);
      details.forEach((detail) => detail.setAlpha(0));
    }
    const obstacle: Obstacle = {
      lane: chartObstacle.lane,
      hitTime: chartObstacle.time,
      groupId: chartObstacle.groupId,
      blockedLanes: chartObstacle.blockedLanes,
      visualType: chartObstacle.visualType,
      judged: false,
      container,
      body,
      shine,
      shadow,
      details,
      assetImage
    };

    body.setStrokeStyle(2, this.themeColor("line"), 0.8);
    this.obstacles.push(obstacle);
    this.layoutObstacle(obstacle, this.getTrackLayout());
  }

  private createObstacleDetails(visualType: ObstacleVisualType) {
    const line = this.themeColor("line");
    const shadow = this.themeColor("shadow");
    const accent = this.themeColor("obstacleAccent");

    if (visualType === "mini_car") {
      return [
        this.add.rectangle(0, -14, 32, 18, this.themeColor("rightLane"), 1),
        this.add.ellipse(-22, 22, 14, 14, shadow, 1),
        this.add.ellipse(22, 22, 14, 14, shadow, 1),
        this.add.rectangle(0, -4, 58, 8, accent, 0.8)
      ];
    }

    if (visualType === "traffic_cone") {
      return [
        this.add.triangle(0, -18, 0, -36, -24, 24, 24, 24, this.themeColor("accent"), 1),
        this.add.rectangle(0, 18, 56, 10, line, 1),
        this.add.rectangle(0, -4, 28, 7, line, 0.88)
      ];
    }

    if (visualType === "cardboard_box") {
      return [
        this.add.rectangle(0, -3, 54, 8, this.themeColor("surface"), 0.8),
        this.add.rectangle(0, 0, 8, 42, this.themeColor("surface"), 0.8),
        this.add.triangle(-14, -20, -26, -20, 0, -34, 0, -20, line, 0.72),
        this.add.triangle(14, -20, 26, -20, 0, -34, 0, -20, line, 0.72)
      ];
    }

    if (visualType === "robot_toy") {
      return [
        this.add.rectangle(0, -30, 38, 16, this.themeColor("secondary"), 1),
        this.add.ellipse(-10, -30, 7, 7, line, 1),
        this.add.ellipse(10, -30, 7, 7, line, 1),
        this.add.rectangle(0, -47, 4, 14, shadow, 0.7),
        this.add.ellipse(0, -56, 9, 9, this.themeColor("accent"), 1)
      ];
    }

    return [
      this.add.ellipse(-14, -12, 10, 10, line, 0.75),
      this.add.ellipse(14, -12, 10, 10, line, 0.75),
      this.add.ellipse(-14, 12, 10, 10, line, 0.75),
      this.add.ellipse(14, 12, 10, 10, line, 0.75)
    ];
  }

  private spawnItem(chartItem: ChartItem) {
    const itemType = this.getItemVisualType(chartItem);
    const glow = this.add.ellipse(0, 0, 48, 30, this.getItemColor(itemType), 0.34);
    const body = this.add.star(0, 0, 5, 8, 18, this.getItemColor(itemType), 1);
    const detail = this.createItemDetail(itemType);
    const assetImage = this.createThemeImage(this.currentThemeAssets.items[itemType], 0, 0, 1);
    const container = this.add.container(0, 0, assetImage ? [glow, body, detail, assetImage] : [glow, body, detail]);
    if (assetImage) {
      body.setAlpha(0);
      detail.setAlpha(0);
    }
    const item: CollectibleItem = {
      lane: chartItem.lane,
      hitTime: chartItem.time,
      itemType,
      score: chartItem.score,
      collected: false,
      container,
      body,
      glow,
      detail,
      assetImage
    };

    body.setStrokeStyle(2, this.themeColor("line"), 0.95);
    this.items.push(item);
    this.layoutItem(item, this.getTrackLayout());
  }

  private createItemDetail(itemType: ItemVisualType) {
    const line = this.themeColor("line");
    if (itemType === "music_note") {
      return this.add.rectangle(8, -4, 6, 30, line, 0.9);
    }

    if (itemType === "drum") {
      return this.add.ellipse(0, 2, 26, 16, line, 0.9);
    }

    if (itemType === "bell") {
      return this.add.triangle(0, 0, 0, -20, -16, 14, 16, 14, line, 0.88);
    }

    if (itemType === "toy_keyboard") {
      return this.add.rectangle(0, 0, 30, 12, line, 0.9);
    }

    return this.add.ellipse(0, 0, 12, 12, line, 0.85);
  }

  private updateObstacles() {
    const track = this.getTrackLayout();

    this.obstacles = this.obstacles.filter((obstacle) => {
      if (!this.isObstacleAlive(obstacle)) {
        return false;
      }

      const z = this.getObstacleZ(obstacle);
      this.judgeObstacle(obstacle, z);

      if (!this.isObstacleAlive(obstacle)) {
        return false;
      }

      if (z >= GAME_BALANCE.obstacleDespawnZ) {
        this.destroyObstacle(obstacle);
        return false;
      }

      this.layoutObstacle(obstacle, track);
      return true;
    });
  }

  private updateItems() {
    const track = this.getTrackLayout();

    this.items = this.items.filter((item) => {
      if (!this.isItemAlive(item)) {
        return false;
      }

      const z = this.getItemZ(item);
      this.judgeItem(item, z);

      if (!this.isItemAlive(item)) {
        return false;
      }

      if (z >= GAME_BALANCE.obstacleDespawnZ || item.collected) {
        this.destroyItem(item);
        return false;
      }

      this.layoutItem(item, track);
      return true;
    });
  }

  private layoutObstacles(track: TrackLayout) {
    this.obstacles = this.obstacles.filter((obstacle) => this.isObstacleAlive(obstacle));
    this.obstacles.forEach((obstacle) => this.layoutObstacle(obstacle, track));
    if (!this.gameStarted && !this.gameEnded) {
      this.obstacles.forEach((obstacle) => obstacle.container.setAlpha(0));
    }
  }

  private layoutItems(track: TrackLayout) {
    this.items = this.items.filter((item) => this.isItemAlive(item));
    this.items.forEach((item) => this.layoutItem(item, track));
    if (!this.gameStarted && !this.gameEnded) {
      this.items.forEach((item) => item.container.setAlpha(0));
    }
  }

  private layoutObstacle(obstacle: Obstacle, track: TrackLayout) {
    if (!this.isObstacleAlive(obstacle)) {
      return;
    }

    const z = this.getObstacleZ(obstacle);
    const point = this.getLaneCenterPoint(track, obstacle.lane, z);
    const left = this.getLaneBoundaryPoint(track, obstacle.lane, z);
    const right = this.getLaneBoundaryPoint(track, obstacle.lane + 1, z);
    const nearPulse = z > 0.72 ? Math.sin(this.time.now / 72) * 0.035 : 0;
    const scale = Phaser.Math.Linear(0.24, 1.22, z) * this.screenScale * (1 + nearPulse);
    const baseSize = this.getPerformanceCueVisualSize(obstacle.lane);
    const laneWidth = right.x - left.x;
    const visualWidth = Phaser.Math.Clamp((laneWidth / scale) * 1.08, 112, 176);
    const size = {
      width: visualWidth,
      height: visualWidth * (baseSize.height / baseSize.width)
    };

    obstacle.container
      .setPosition(point.x, point.y)
      .setScale(scale)
      .setAngle(z > 0.76 ? Math.sin(this.time.now / 90 + obstacle.lane) * 2 : 0)
      .setDepth(Math.round(z * 100));
    obstacle.body.setSize(size.width, size.height);
    obstacle.shine.setSize(size.width * 0.42, 6);
    obstacle.shadow.setSize(size.width * Phaser.Math.Linear(0.65, 1.05, z), 14 + z * 8);
    obstacle.shadow.setAlpha(0.16 + z * 0.22);
    obstacle.assetImage?.setDisplaySize(size.width * 1.24, size.height * 1.24);
  }

  private layoutItem(item: CollectibleItem, track: TrackLayout) {
    if (!this.isItemAlive(item)) {
      return;
    }

    const z = this.getItemZ(item);
    const point = this.getLaneCenterPoint(track, item.lane, z);
    const left = this.getLaneBoundaryPoint(track, item.lane, z);
    const right = this.getLaneBoundaryPoint(track, item.lane + 1, z);
    const scale = Phaser.Math.Linear(0.28, 1.18, z) * this.screenScale;
    const laneWidth = right.x - left.x;
    const imageSize = Phaser.Math.Clamp((laneWidth / scale) * 1.34, 150, 228);
    const runPhase = this.time.now / 82 + item.hitTime * 5 + item.lane * 0.7;
    const pulse = 1 + Math.sin(runPhase) * Phaser.Math.Linear(0.045, 0.1, z);
    const hop = Math.abs(Math.sin(runPhase)) * Phaser.Math.Linear(2, 10, z) * this.screenScale;
    const runLean = Math.sin(runPhase * 0.7) * Phaser.Math.Linear(5, 1.6, z);

    item.container
      .setPosition(point.x, point.y - 18 * scale - hop)
      .setScale(scale * pulse)
      .setAngle(runLean)
      .setDepth(Math.round(z * 100) + 20);
    item.glow.setSize(imageSize * 0.84, imageSize * 0.48);
    item.body.setFillStyle(this.getItemColor(item.itemType), 1);
    item.assetImage?.setDisplaySize(imageSize, imageSize);
  }

  private getPerformanceCueItemType(lane: number): ItemVisualType {
    if (lane === 0) {
      return "drum";
    }

    if (lane === 1) {
      return "bell";
    }

    return "toy_keyboard";
  }

  private getPerformanceCueText(lane: number) {
    if (lane === 0) {
      return "DRUM!";
    }

    if (lane === 1) {
      return "BELL!";
    }

    return "KEYS!";
  }

  private getPerformanceCueVisualSize(lane: number) {
    if (lane === 0) {
      return { width: 1, height: 0.86 };
    }

    if (lane === 1) {
      return { width: 1, height: 1 };
    }

    return { width: 1, height: 0.72 };
  }

  private isObstacleAlive(obstacle: Obstacle) {
    return Boolean(
      obstacle.container.scene &&
        obstacle.body.scene &&
        obstacle.shine.scene &&
        obstacle.shadow.scene &&
        obstacle.details.every((detail) => detail.scene) &&
        (!obstacle.assetImage || obstacle.assetImage.scene)
    );
  }

  private isItemAlive(item: CollectibleItem) {
    return Boolean(item.container.scene && item.body.scene && item.glow.scene && item.detail.scene && (!item.assetImage || item.assetImage.scene));
  }

  private destroyObstacle(obstacle: Obstacle) {
    this.tweens.killTweensOf(obstacle.container);
    if (obstacle.container.scene) {
      obstacle.container.destroy(true);
    }
  }

  private destroyItem(item: CollectibleItem) {
    this.tweens.killTweensOf(item.container);
    if (item.container.scene) {
      item.container.destroy(true);
    }
  }

  private getObstacleVisualType(index: number): ObstacleVisualType {
    const obstacleTypes = this.currentTheme.world.obstacleTypes as ObstacleVisualType[];
    const fallbackTypes: ObstacleVisualType[] = ["toy_block", "mini_car", "traffic_cone", "cardboard_box", "robot_toy"];
    const types = obstacleTypes.length > 0 ? obstacleTypes : fallbackTypes;
    return types[index % types.length] ?? "toy_block";
  }

  private getObstacleVisualSize(visualType: ObstacleVisualType) {
    if (visualType === "mini_car") {
      return { width: 64, height: 36 };
    }

    if (visualType === "traffic_cone") {
      return { width: 44, height: 62 };
    }

    if (visualType === "robot_toy") {
      return { width: 52, height: 56 };
    }

    if (visualType === "cardboard_box") {
      return { width: 58, height: 48 };
    }

    return { width: GAME_BALANCE.obstacleBaseWidth, height: GAME_BALANCE.obstacleBaseHeight };
  }

  private getItemVisualType(chartItem: ChartItem): ItemVisualType {
    if (chartItem.type === "music_note" || chartItem.sound.includes("note")) {
      return "music_note";
    }

    if (chartItem.sound.includes("drum")) {
      return "drum";
    }

    if (chartItem.sound.includes("bell")) {
      return "bell";
    }

    if (chartItem.sound.includes("keyboard")) {
      return "toy_keyboard";
    }

    const types = this.currentTheme.world.itemTypes as ItemVisualType[];
    return types[Math.floor(chartItem.time) % Math.max(1, types.length)] ?? "star";
  }

  private getItemColor(itemType: ItemVisualType) {
    if (itemType === "music_note") {
      return this.themeColor("rightLane");
    }

    if (itemType === "drum") {
      return this.themeColor("leftLane");
    }

    if (itemType === "bell") {
      return this.themeColor("centerLane");
    }

    if (itemType === "toy_keyboard") {
      return this.themeColor("secondary");
    }

    return this.themeColor("accent");
  }

  private judgeItem(item: CollectibleItem, z: number) {
    if (item.collected || z < GAME_BALANCE.obstacleJudgeZ) {
      return;
    }

    if (!this.isRunnerJumping(item.lane)) {
      return;
    }

    item.collected = true;
    this.score += item.score;
    this.itemSe?.play();
    this.popItemCollect(item);
    this.spawnItemParticles(item);
    this.popFeedback(`ITEM +${item.score}`, this.currentTheme.colors.accent);
    this.cameras.main.shake(70, 0.0015);
    this.layout();
  }

  private popItemCollect(item: CollectibleItem) {
    const burst = this.add.star(item.container.x, item.container.y, 5, 8 * item.container.scaleX, 24 * item.container.scaleX, this.getItemColor(item.itemType), 0.95);
    burst.setDepth(item.container.depth + 30);
    this.tweens.add({
      targets: burst,
      scale: 1.8,
      alpha: 0,
      angle: 45,
      duration: 300,
      ease: "Sine.Out",
      onComplete: () => burst.destroy()
    });
  }

  private spawnItemParticles(item: CollectibleItem) {
    const color = this.getItemColor(item.itemType);
    const particleKind = item.itemType === "drum" ? "circle" : item.itemType === "music_note" ? "note" : "star";
    this.spawnParticleBurst(item.container.x, item.container.y, {
      color,
      count: item.itemType === "toy_keyboard" ? 14 : 10,
      distance: item.itemType === "drum" ? 54 : 42,
      kind: particleKind,
      duration: 420
    });
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

    if (this.isRunnerJumping(obstacle.lane)) {
      this.registerAvoid(groupObstacles, obstacle);
      return;
    }

    this.registerMiss(groupObstacles);
  }

  private registerAvoid(obstacles: Obstacle[], judgedObstacle: Obstacle) {
    this.combo += 1;
    this.avoidCount += 1;
    const difficulty = DIFFICULTY_SETTINGS[this.selectedDifficulty];
    const scoreGain = Math.round((100 + Math.min(this.combo, 20) * 10) * difficulty.scoreMultiplier);
    this.score += scoreGain;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const judgeText = this.getJudgeText(judgedObstacle);
    obstacles.forEach((obstacle) => {
      if (!this.isObstacleAlive(obstacle)) {
        return;
      }

      obstacle.body.setFillStyle(this.themeColor("secondary"), 1);
      obstacle.shine.setFillStyle(this.themeColor("line"), 0.95);
      this.fadeOutPanel(obstacle);
    });
    this.spawnSuccessEffects(judgedObstacle, judgeText);
    this.playRunnerPerformance(judgedObstacle.lane);
    this.playPerformanceSe(judgedObstacle.lane);
    const enteredFever = !this.feverActive && this.combo >= GAME_BALANCE.feverComboThreshold;
    if (enteredFever) {
      this.setFeverActive(true);
    } else {
      this.popFeedback(judgeText, this.currentTheme.colors.secondary);
    }
    this.triggerComboMilestone();
    this.pulseHudLabel(this.comboLabel);
    this.pulseHudLabel(this.scoreLabel);
    this.refreshHudLayout();
  }

  private registerMiss(obstacles: Obstacle[]) {
    this.combo = 0;
    this.missCount += 1;
    this.setFeverActive(false);
    const missPoint = obstacles.find((obstacle) => this.isObstacleAlive(obstacle));
    obstacles.forEach((obstacle) => {
      if (!this.isObstacleAlive(obstacle)) {
        return;
      }

      obstacle.body.setFillStyle(this.themeColor("primary"), 1);
      obstacle.shine.setFillStyle(this.themeColor("accent"), 0.95);
      this.fadeOutPanel(obstacle);
    });
    if (this.time.now - this.lastMissEffectAt > 180) {
      this.lastMissEffectAt = this.time.now;
      this.cameras.main.shake(90, 0.0025);
      this.flashRunner(obstacles[0]?.lane ?? 1);
      if (missPoint) {
        this.spawnMissEffects(missPoint);
      }
      this.popFeedback("REST!", this.currentTheme.colors.primary);
    }
    this.pulseHudLabel(this.missLabel);
    this.refreshHudLayout();
  }

  private pulseHudLabel(label: Phaser.GameObjects.Text | undefined) {
    if (!label) {
      return;
    }

    this.tweens.killTweensOf(label);
    label.setScale(1.08);
    this.tweens.add({
      targets: label,
      scale: 1,
      duration: 180,
      ease: "Back.Out"
    });
  }

  private getJudgeText(obstacle: Obstacle) {
    const z = this.getObstacleZ(obstacle);
    if (z < GAME_BALANCE.obstacleJudgeZ + 0.045) {
      return "PERFECT!!";
    }

    if (z < GAME_BALANCE.obstacleJudgeZ + 0.11) {
      return "COOL!!";
    }

    return "NICE!!";
  }

  private spawnSuccessEffects(obstacle: Obstacle, judgeText: string) {
    if (!this.isObstacleAlive(obstacle)) {
      return;
    }

    const cueType = this.getPerformanceCueItemType(obstacle.lane);
    const color = this.getItemColor(cueType);
    this.cameras.main.shake(this.feverActive ? 65 : 45, this.feverActive ? 0.002 : 0.0012);
    this.spawnParticleBurst(obstacle.container.x, obstacle.container.y - 16 * obstacle.container.scaleY, {
      color,
      count: this.feverActive ? 14 : 8,
      distance: this.feverActive ? 54 : 36,
      kind: cueType === "drum" ? "circle" : cueType === "toy_keyboard" ? "note" : "star",
      duration: 360
    });
    this.spawnStickerText(this.getPerformanceCueText(obstacle.lane), obstacle.container.x, obstacle.container.y - 58 * obstacle.container.scaleY, color);
    this.spawnStickerText(judgeText, obstacle.container.x, obstacle.container.y - 96 * obstacle.container.scaleY, color, 0.78);
  }

  private spawnMissEffects(obstacle: Obstacle) {
    this.spawnStickerText("REST!", obstacle.container.x, obstacle.container.y - 48 * obstacle.container.scaleY, this.themeColor("primary"));
    this.spawnParticleBurst(obstacle.container.x, obstacle.container.y, {
      color: this.themeColor("primary"),
      count: 6,
      distance: 26,
      kind: "circle",
      duration: 260
    });
  }

  private triggerComboMilestone() {
    if (![10, 30, 50, 100].includes(this.combo)) {
      return;
    }

    const { width, height } = this.scale;
    const text = `${this.combo} COMBO`;
    const color = this.combo >= 50 ? this.themeColor("accent") : this.themeColor("secondary");
    this.spawnStickerText(text, width / 2, height * (this.isPortrait ? 0.23 : 0.32), color, 1.14);
    this.spawnParticleBurst(width / 2, height * (this.isPortrait ? 0.25 : 0.34), {
      color,
      count: this.combo >= 50 ? 22 : 12,
      distance: this.combo >= 50 ? 82 : 48,
      kind: this.combo >= 30 ? "note" : "star",
      duration: this.combo >= 50 ? 620 : 420
    });

    if (this.combo >= 50) {
      this.cameras.main.flash(110, 255, 243, 216, false);
    }
  }

  private refreshHudLayout() {
    if (this.time.now - this.lastLayoutRefreshAt < 50) {
      return;
    }

    this.lastLayoutRefreshAt = this.time.now;
    this.comboLabel?.setText(`${this.combo}`);
    this.scoreLabel?.setText(this.score.toString().padStart(6, "0"));
    this.missLabel?.setText(this.missCount.toString().padStart(3, "0"));
  }

  private fadeOutPanel(obstacle: Obstacle) {
    if (!this.isObstacleAlive(obstacle)) {
      return;
    }

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

  private spawnStickerText(text: string, x: number, y: number, color: number, scale = 1) {
    const sticker = this.add.text(x, y, text, {
      fontFamily: UI_FONT,
      fontStyle: "900",
      color: this.currentTheme.colors.text,
      backgroundColor: this.currentTheme.colors.background,
      padding: {
        x: Math.round(8 * this.screenScale),
        y: Math.round(4 * this.screenScale)
      }
    });

    sticker
      .setOrigin(0.5)
      .setDepth(360)
      .setFontSize(Math.round(18 * this.screenScale * scale))
      .setAngle(Phaser.Math.Between(-8, 8))
      .setStroke(this.currentTheme.colors.line, Math.max(2, Math.round(3 * this.screenScale)))
      .setAlpha(0)
      .setScale(0.65);

    this.tweens.add({
      targets: sticker,
      alpha: 1,
      scale: 1,
      y: y - 12 * this.screenScale,
      duration: 120,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: sticker,
          alpha: 0,
          scale: 1.22,
          y: y - 46 * this.screenScale,
          duration: 340,
          ease: "Sine.Out",
          onComplete: () => sticker.destroy()
        });
      }
    });

    const underline = this.add.rectangle(x, y + 15 * this.screenScale, 64 * this.screenScale * scale, 5 * this.screenScale, color, 0.95);
    underline.setDepth(359).setAngle(sticker.angle);
    this.tweens.add({
      targets: underline,
      alpha: 0,
      scaleX: 1.4,
      y: y - 24 * this.screenScale,
      duration: 420,
      ease: "Sine.Out",
      onComplete: () => underline.destroy()
    });
  }

  private spawnParticleBurst(
    x: number,
    y: number,
    options: {
      color: number;
      count: number;
      distance: number;
      kind: "star" | "circle" | "note";
      duration: number;
    }
  ) {
    const scale = this.screenScale;
    const maxCount = this.isPortrait ? Math.min(options.count, 14) : options.count;

    for (let index = 0; index < maxCount; index += 1) {
      const angle = (Math.PI * 2 * index) / maxCount + Phaser.Math.FloatBetween(-0.22, 0.22);
      const distance = options.distance * scale * Phaser.Math.FloatBetween(0.55, 1.08);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      const particle = this.createParticleShape(x, y, options.color, options.kind);

      particle.setDepth(355);
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: Phaser.Math.FloatBetween(0.55, 1.4),
        angle: Phaser.Math.Between(-120, 120),
        duration: options.duration + Phaser.Math.Between(-70, 90),
        ease: "Sine.Out",
        onComplete: () => particle.destroy()
      });
    }
  }

  private createParticleShape(x: number, y: number, color: number, kind: "star" | "circle" | "note") {
    if (kind === "note") {
      const noteImage = this.createThemeImage(this.currentThemeAssets.effects.particleNote, x, y, 355);
      if (noteImage) {
        noteImage.setDisplaySize(22 * this.screenScale, 22 * this.screenScale).setTint(color);
        return noteImage;
      }
    }

    if (kind === "star") {
      const starImage = this.createThemeImage(this.currentThemeAssets.effects.particleStar, x, y, 355);
      if (starImage) {
        starImage.setDisplaySize(20 * this.screenScale, 20 * this.screenScale).setTint(color);
        return starImage;
      }
    }

    if (kind === "note") {
      const stem = this.add.rectangle(4 * this.screenScale, -8 * this.screenScale, 4 * this.screenScale, 18 * this.screenScale, color, 0.95);
      const head = this.add.ellipse(-2 * this.screenScale, 6 * this.screenScale, 12 * this.screenScale, 9 * this.screenScale, color, 0.95);
      return this.add.container(x, y, [stem, head]);
    }

    if (kind === "circle") {
      return this.add.ellipse(x, y, 11 * this.screenScale, 11 * this.screenScale, color, 0.86);
    }

    return this.add.star(x, y, 5, 4 * this.screenScale, 11 * this.screenScale, color, 0.92);
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
          "TAP TO START"
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

  private flashRunner(lane: number) {
    const runner = this.runners[lane];
    if (!runner) {
      return;
    }

    this.tweens.killTweensOf(runner.body);
    this.tweens.killTweensOf(runner.container);
    runner.body.setFillStyle(this.themeColor("primary"), 1);
    this.setRunnerVisualState(lane, "miss");
    runner.container.setAngle(lane === 0 ? -5 : lane === 2 ? 5 : 0);
    this.tweens.add({
      targets: runner.body,
      duration: 160,
      yoyo: true,
      repeat: 1,
      alpha: 0.55,
      onComplete: () => {
        runner.body.setAlpha(1).setFillStyle(this.runnerColor(lane), 1);
      }
    });
    this.tweens.add({
      targets: runner.container,
      angle: 0,
      y: runner.container.y + 8 * this.screenScale,
      duration: 140,
      yoyo: true,
      ease: "Sine.InOut",
      onComplete: () => {
        this.setRunnerVisualState(lane, "run");
        this.layoutPlayers(this.getTrackLayout());
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
      this.popFeedback("FEVER!", this.currentTheme.colors.accent);
      this.spawnParticleBurst(this.scale.width / 2, this.scale.height * 0.26, {
        color: this.themeColor("accent"),
        count: 26,
        distance: 120,
        kind: "note",
        duration: 720
      });
      this.pulseHudLabel(this.comboLabel);
      this.pulseHudLabel(this.scoreLabel);

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

  private updateFeverCameraBump() {
    if (this.time.now - this.lastFeverCameraBumpAt < 850) {
      return;
    }

    this.lastFeverCameraBumpAt = this.time.now;
    this.cameras.main.shake(70, 0.0012);
    this.pulseHudLabel(this.comboLabel);
    this.pulseHudLabel(this.scoreLabel);
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

  private get currentTheme(): ThemeConfig {
    return THEMES[this.selectedSong.themeId] ?? DEFAULT_THEME;
  }

  private get currentThemeAssets(): ThemeAssetConfig {
    return THEME_ASSETS[this.selectedSong.themeId] ?? THEME_ASSETS["tiny-toy-sprint"];
  }

  private themeColor(colorName: keyof ThemeConfig["colors"]) {
    return toColorNumber(this.currentTheme.colors[colorName]);
  }

  private createThemeImage(assetKey: string | undefined, x: number, y: number, depth: number) {
    if (!assetKey || !this.textures.exists(assetKey)) {
      return undefined;
    }

    return this.add.image(x, y, assetKey).setDepth(depth);
  }

  private fitImageInBox(image: Phaser.GameObjects.Image | undefined, maxWidth: number, maxHeight: number) {
    if (!image || maxWidth <= 0 || maxHeight <= 0) {
      return;
    }

    const source = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const sourceWidth = source?.width || maxWidth;
    const sourceHeight = source?.height || maxHeight;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);

    image.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
  }

  private getDifficultyAssetKey(id: DifficultyId) {
    if (id === "easy") {
      return this.currentThemeAssets.ui.parts.difficultyEasy;
    }

    if (id === "hard") {
      return this.currentThemeAssets.ui.parts.difficultyHard;
    }

    return this.currentThemeAssets.ui.parts.difficultyNormal;
  }

  private getSelectedDifficultyAssetKey(id: DifficultyId) {
    if (id === "easy") {
      return this.currentThemeAssets.ui.parts.difficultyEasySelected;
    }

    if (id === "hard") {
      return this.currentThemeAssets.ui.parts.difficultyHardSelected;
    }

    return this.currentThemeAssets.ui.parts.difficultyNormalSelected;
  }

  private getJumpButtonAssetKey(lane: number) {
    if (lane === 0) {
      return this.currentThemeAssets.ui.parts.jumpButtonLeft;
    }

    if (lane === 1) {
      return this.currentThemeAssets.ui.parts.jumpButtonCenter;
    }

    return this.currentThemeAssets.ui.parts.jumpButtonRight;
  }

  private getJumpButtonPressedAssetKey(lane: number) {
    if (lane === 0) {
      return this.currentThemeAssets.ui.parts.jumpButtonLeftPressed;
    }

    if (lane === 1) {
      return this.currentThemeAssets.ui.parts.jumpButtonCenterPressed;
    }

    return this.currentThemeAssets.ui.parts.jumpButtonRightPressed;
  }

  private createRunnerAssetImage(lane: number) {
    const spriteSheetKey = this.getRunnerSpriteSheetKey(lane);
    if (spriteSheetKey && this.textures.exists(spriteSheetKey)) {
      return this.add.sprite(0, 0, spriteSheetKey, RUNNER_IDLE_FRAME).setDepth(1).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    }

    const assetKey =
      lane === 0
        ? this.currentThemeAssets.characters.left
        : lane === 1
          ? this.currentThemeAssets.characters.center
          : this.currentThemeAssets.characters.right;

    const image = this.createThemeImage(assetKey, 0, 0, 1);
    image?.setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    return image;
  }

  private getRunnerSpriteSheetKey(lane: number) {
    const laneKey = lane === 0 ? "left" : lane === 1 ? "center" : "right";
    return this.currentThemeAssets.characters.spriteSheets[laneKey];
  }

  private setRunnerVisualState(lane: number, state: RunnerVisualState) {
    const runner = this.runners[lane];
    if (!(runner?.assetImage instanceof Phaser.GameObjects.Sprite)) {
      return;
    }

    runner.assetImage.setFrame(this.getRunnerFrame(state)).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    if (state === "run") {
      this.startRunnerIdleAnimation(runner);
      return;
    }

    this.stopRunnerIdleAnimation(runner);
  }

  private getRunnerFrame(state: RunnerVisualState) {
    if (state === "jump") {
      return 1;
    }

    if (state === "land") {
      return 4;
    }

    if (state === "miss") {
      return 0;
    }

    return RUNNER_IDLE_FRAME;
  }

  private startRunnerIdleAnimation(runner: Runner) {
    if (!(runner.assetImage instanceof Phaser.GameObjects.Sprite) || runner.idleTween?.isPlaying()) {
      return;
    }

    runner.assetImage.setY(0).setAngle(0);
    runner.idleTween = this.tweens.add({
      targets: runner.assetImage,
      y: -5 * this.screenScale,
      duration: 620 + runner.lane * 90,
      delay: runner.lane * 120,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1
    });
  }

  private stopRunnerIdleAnimation(runner: Runner) {
    runner.idleTween?.stop();
    runner.idleTween?.remove();
    runner.idleTween = undefined;
    runner.assetImage?.setY(0);
  }

  private playRunnerPerformance(lane: number) {
    const runner = this.runners[lane];
    if (!(runner?.assetImage instanceof Phaser.GameObjects.Sprite)) {
      return;
    }

    this.stopRunnerIdleAnimation(runner);
    const startY = runner.assetImage.y;
    const startAngle = lane === 0 ? -4 : lane === 2 ? 4 : 0;

    this.tweens.killTweensOf(runner.assetImage);
    runner.assetImage.setFrame(1).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT).setAngle(startAngle);
    this.time.delayedCall(55, () => {
      runner.assetImage?.setFrame(2).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    });
    this.time.delayedCall(130, () => {
      runner.assetImage?.setFrame(3).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    });
    this.time.delayedCall(215, () => {
      runner.assetImage?.setFrame(4).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    });
    this.tweens.add({
      targets: runner.assetImage,
      angle: 0,
      y: startY - 6 * this.screenScale,
      duration: 90,
      ease: "Sine.Out",
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(135, () => {
          runner.assetImage?.setFrame(RUNNER_IDLE_FRAME).setY(startY).setAngle(0).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
          this.startRunnerIdleAnimation(runner);
        });
      }
    });
  }

  private runnerColor(lane: number) {
    if (lane === 0) {
      return this.themeColor("leftLane");
    }

    if (lane === 1) {
      return this.themeColor("centerLane");
    }

    return this.themeColor("rightLane");
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

  private loadLayoutDebug() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(LAYOUT_DEBUG_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<LayoutDebugState>;
      this.layoutDebug = {
        trackY: this.clampLayoutDebugValue(parsed.trackY, -16, 16),
        farY: this.clampLayoutDebugValue(parsed.farY, -16, 16),
        farW: this.clampLayoutDebugValue(parsed.farW, -12, 18),
        nearW: this.clampLayoutDebugValue(parsed.nearW, -12, 18),
        bgY: this.clampLayoutDebugValue(parsed.bgY, -18, 18),
        bgScale: this.clampLayoutDebugValue(parsed.bgScale, -10, 20)
      };
    } catch {
      this.layoutDebug = { ...DEFAULT_LAYOUT_DEBUG };
    }
  }

  private saveLayoutDebug() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LAYOUT_DEBUG_STORAGE_KEY, JSON.stringify(this.layoutDebug));
  }

  private clampLayoutDebugValue(value: unknown, min: number, max: number) {
    return Phaser.Math.Clamp(Number.isFinite(value) ? Number(value) : 0, min, max);
  }

  private resetLayoutDebug() {
    this.layoutDebug = { ...DEFAULT_LAYOUT_DEBUG };
    this.saveLayoutDebug();
    this.popFeedback("LAYOUT RESET", this.currentTheme.colors.accent);
    this.layout();
  }

  private getLayoutDebugSummary() {
    return `LAYOUT T${this.layoutDebug.trackY} F${this.layoutDebug.farY} FW${this.layoutDebug.farW} NW${this.layoutDebug.nearW} BY${this.layoutDebug.bgY} BZ${this.layoutDebug.bgScale}`;
  }

  private tryLayoutDebugHotkey(event: KeyboardEvent) {
    const hotkeys: Partial<Record<string, DebugAction>> = {
      KeyI: "trackYDown",
      KeyK: "trackYUp",
      KeyU: "farYDown",
      KeyJ: "farYUp",
      KeyO: "farWDown",
      KeyL: "farWUp",
      KeyP: "nearWDown",
      Semicolon: "nearWUp",
      KeyY: "bgYDown",
      KeyH: "bgYUp",
      KeyT: "bgScaleDown",
      KeyG: "bgScaleUp"
    };

    if (event.code === "Digit0") {
      event.preventDefault();
      this.resetLayoutDebug();
      return true;
    }

    const action = hotkeys[event.code];
    if (!action) {
      return false;
    }

    event.preventDefault();
    this.adjustLayoutDebug(action);
    return true;
  }

  private get rankingApiPath() {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/rankings`;
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

  private getTrackScrollOffset(spacing: number) {
    const speed = this.feverActive ? TRACK_FEVER_SCROLL_SPEED : TRACK_SCROLL_SPEED;
    return ((this.songTimeSeconds * speed) % spacing + spacing) % spacing;
  }

  private getRunnerRunPhase(lane: number) {
    return this.songTimeSeconds * (this.feverActive ? 18 : 14) + lane * 0.72;
  }

  private tryJumpFromPointer(x: number, y: number) {
    const targetButton = this.jumpButtons.find((button) => button.background.getBounds().contains(x, y));
    if (targetButton) {
      this.jumpRunner(targetButton.lane);
      return;
    }

    const laneWidth = this.scale.width / GAME_BALANCE.laneCount;
    const lane = Phaser.Math.Clamp(Math.floor(x / laneWidth), 0, GAME_BALANCE.laneCount - 1);
    this.jumpRunner(lane);
  }

  private jumpRunner(lane: number) {
    const runner = this.runners[lane];
    if (!runner || runner.isJumping) {
      return;
    }

    runner.isJumping = true;
    this.setRunnerVisualState(lane, "jump");
    this.pulseJumpButton(lane);
    this.spawnJumpEffects(runner);
    this.tweens.killTweensOf(runner.container);
    this.tweens.killTweensOf(runner.shadow);
    this.tweens.killTweensOf(runner.body);
    if (runner.assetImage) {
      this.tweens.killTweensOf(runner.assetImage);
    }
    runner.container.setAngle(0);
    runner.assetImage?.setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    this.tweens.add({
      targets: runner.container,
      angle: lane === 0 ? -3 : lane === 2 ? 3 : 0,
      scaleX: runner.container.scaleX * 1.04,
      scaleY: runner.container.scaleY * 0.96,
      duration: 95,
      ease: "Back.Out",
      yoyo: true,
      hold: 120,
      onComplete: () => {
        runner.isJumping = false;
        this.setRunnerVisualState(lane, "run");
        runner.container.setAngle(0);
        this.layoutPlayers(this.getTrackLayout());
      }
    });
    this.tweens.add({
      targets: runner.shadow,
      scaleX: 1.08,
      scaleY: 0.92,
      alpha: 0.38,
      duration: 110,
      ease: "Sine.Out",
      yoyo: true,
      hold: 100,
      onComplete: () => {
        runner.shadow.setAlpha(0.32).setScale(1);
      }
    });
  }

  private spawnJumpEffects(runner: Runner) {
    const color = this.runnerColor(runner.lane);
    const x = runner.container.x;
    const y = runner.container.y;
    const ghost = this.add.ellipse(x, y, 44 * runner.container.scaleX, 54 * runner.container.scaleY, color, 0.24);
    ghost.setDepth(runner.container.depth - 1);
    this.tweens.add({
      targets: ghost,
      y: y + 14 * this.screenScale,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 0.82,
      duration: 280,
      ease: "Sine.Out",
      onComplete: () => ghost.destroy()
    });

    this.spawnParticleBurst(x, y - 18 * runner.container.scaleY, {
      color,
      count: this.feverActive ? 9 : 5,
      distance: this.feverActive ? 34 : 22,
      kind: "star",
      duration: 280
    });
  }

  private playLandingSquash(runner: Runner) {
    this.tweens.killTweensOf(runner.body);
    runner.body.setScale(1.16, 0.78);
    this.tweens.add({
      targets: runner.body,
      scaleX: 1,
      scaleY: 1,
      duration: 140,
      ease: "Back.Out",
      onComplete: () => {
        this.setRunnerVisualState(runner.lane, "run");
      }
    });
    runner.shadow.setScale(1.18, 1.12).setAlpha(0.5);
    this.tweens.add({
      targets: runner.shadow,
      scaleX: 1,
      scaleY: 1,
      alpha: 0.32,
      duration: 150,
      ease: "Sine.Out"
    });
  }

  private pulseJumpButton(lane: number) {
    const button = this.jumpButtons[lane];
    if (!button) {
      return;
    }

    this.tweens.killTweensOf([button.background, button.label, button.assetImage, button.pressedAssetImage]);
    button.background.setScale(0.94, 0.9);
    button.label.setScale(0.95);
    button.assetImage?.setAlpha(0);
    button.pressedAssetImage?.setAlpha(0.98).setVisible(true);
    this.tweens.add({
      targets: [button.background, button.label],
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: "Back.Out",
      onComplete: () => {
        button.pressedAssetImage?.setAlpha(0);
        button.assetImage?.setAlpha(this.gameStarted ? 0.95 : 0);
      }
    });
  }

  private isRunnerJumping(lane: number) {
    return this.runners[lane]?.isJumping ?? false;
  }

  private playMoveSe() {
    this.moveSe?.play();
  }

  private playPerformanceSe(lane: number) {
    const se = lane === 0 ? this.redPerformanceSe : lane === 1 ? this.yellowPerformanceSe : this.bluePerformanceSe;
    se?.play();
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
    this.redPerformanceSe?.destroy();
    this.redPerformanceSe = undefined;
    this.yellowPerformanceSe?.destroy();
    this.yellowPerformanceSe = undefined;
    this.bluePerformanceSe?.destroy();
    this.bluePerformanceSe = undefined;
    this.clearObstacles();
    this.clearItems();
    this.inputController?.destroy();
    this.inputController = undefined;
    this.input.keyboard?.off("keydown", this.handleKeyDown);
    this.input.off("pointerdown", this.handlePointerDown);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  private clearObstacles() {
    this.obstacles.forEach((obstacle) => this.destroyObstacle(obstacle));
    this.obstacles = [];
  }

  private clearItems() {
    this.items.forEach((item) => this.destroyItem(item));
    this.items = [];
  }
}
