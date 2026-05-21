import * as Phaser from "phaser";
import { GAME_BALANCE } from "@/game/config/balance";
import { BACKGROUND_COLOR, BASE_GAME_HEIGHT, BASE_GAME_WIDTH } from "@/game/config/gameConfig";
import { SONGS, type SongDefinition } from "@/game/config/songs";
import { THEME_ASSETS, type ThemeAssetConfig } from "@/game/config/themeAssets";
import { DEFAULT_THEME, THEMES, type ThemeConfig, type ThemeId } from "@/game/config/themes";
import { loadAudioSettings, saveAudioSettings, type AudioSettings } from "@/game/systems/AudioSettings";
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
  isPopping?: boolean;
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
  judged?: boolean;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Ellipse;
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
type MenuStep = "start" | "ranking" | "result" | "song" | "difficulty" | "settings";
type MenuAction = "play" | "ranking" | "setting" | "help" | "back" | "home" | "retry";
type AudioSettingKind = "bgm" | "se";
type ResultStatKind = "score" | "perfect" | "nice" | "good" | "miss" | "maxCombo";
type SettingsReturnStep = "start" | "song" | "difficulty" | "result";
type RunnerVisualState = "run" | "jump" | "land" | "miss";
type ObstacleVisualType = "toy_block" | "mini_car" | "traffic_cone" | "cardboard_box" | "robot_toy";
type ItemVisualType = "star" | "music_note" | "drum" | "bell" | "toy_keyboard";

interface AudioSettingSlider {
  kind: AudioSettingKind;
  track: Phaser.GameObjects.Graphics;
  fill: Phaser.GameObjects.Graphics;
  knob: Phaser.GameObjects.Graphics;
  trackHit: Phaser.GameObjects.Rectangle;
  knobHit: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  valueLabel: Phaser.GameObjects.Text;
}

interface ResultStatPart {
  kind: ResultStatKind;
  image?: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

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
  thumbnailImage?: Phaser.GameObjects.Image;
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
const HUD_NUMBER_COLOR = "#5A3824";
const HUD_NUMBER_Y_OFFSET = 22;
const HUD_LEFT_NUMBER_X_OFFSET = 10;
const HUD_RIGHT_NUMBER_X_OFFSET = 10;
const RUNNER_DISPLAY_WIDTH = 252;
const RUNNER_DISPLAY_HEIGHT = 252;
const RUNNER_IDLE_FRAME = 5;
const RUNNER_MIN_SCREEN_SCALE = 0.9;
const TRACK_SCROLL_SPEED = 0.36;
const TRACK_FEVER_SCROLL_SPEED = 0.58;
const NORMAL_GAMEPLAY_THEME_ID: ThemeId = "techno-industrial";
const FEVER_GAMEPLAY_THEME_ID: ThemeId = "dnb-neon-city";
const JUDGE_WINDOWS_SECONDS = {
  perfect: 0.12,
  good: 0.24,
  nice: 0.46
};
const RUN_START_DELAY_MS = 1800;
const RUN_FINISH_DELAY_MS = 3000;
const BGM_BASE_VOLUME = 0.55;
const MENU_BGM_AUDIO_KEY = "bgm_toybox_moon_menu";
const MOVE_SE_BASE_VOLUME = 0.68;
const ITEM_SE_BASE_VOLUME = 0.76;
const PERFORMANCE_SE_BASE_VOLUME = 0.86;
const LAYOUT_TUNING_BASE_NEAR_W = 11;
const RANKINGS_STORAGE_KEY = "beat-runner-rankings-v1";
const toColorNumber = (hexColor: string) => Number.parseInt(hexColor.replace("#", ""), 16);

type LayoutTuningState = {
  trackY: number;
  farY: number;
  farW: number;
  nearW: number;
  portraitFarY: number;
  portraitNearW: number;
  characterSize: number;
  characterX: number;
  characterY: number;
  buttonSize: number;
  buttonY: number;
  itemSize: number;
  bgX: number;
  bgY: number;
  bgScale: number;
  resultLeftX: number;
  resultRightX: number;
  resultLeftW: number;
  resultTitleX: number;
  resultTitleY: number;
  resultTitleS: number;
  resultSongY: number;
  resultSongS: number;
  resultScoreX: number;
  resultScoreY: number;
  resultScoreS: number;
  resultScoreH: number;
  resultStatY: number;
  resultStatGap: number;
  resultStatH: number;
  resultStatS: number;
  resultBottomY: number;
  resultBgX: number;
  resultBgY: number;
  resultBgScale: number;
  resultDifficultyX: number;
  resultDifficultyY: number;
  resultDifficultyS: number;
};

const DEFAULT_LAYOUT_TUNING: LayoutTuningState = {
  trackY: -10,
  farY: 15,
  farW: -24,
  nearW: 27,
  portraitFarY: -8,
  portraitNearW: -1,
  characterSize: 5,
  characterX: 0,
  characterY: 33,
  buttonSize: 0,
  buttonY: 5,
  itemSize: -9,
  bgX: -2,
  bgY: 1,
  bgScale: 2,
  resultLeftX: 11,
  resultRightX: -2,
  resultLeftW: -6,
  resultTitleX: 0,
  resultTitleY: 0,
  resultTitleS: 0,
  resultSongY: -13,
  resultSongS: 24,
  resultScoreX: 0,
  resultScoreY: -6,
  resultScoreS: -3,
  resultScoreH: 6,
  resultStatY: -10,
  resultStatGap: 1,
  resultStatH: 2,
  resultStatS: -10,
  resultBottomY: -1,
  resultBgX: 0,
  resultBgY: 0,
  resultBgScale: 0,
  resultDifficultyX: -17,
  resultDifficultyY: 0,
  resultDifficultyS: 17
};

export class MainScene extends Phaser.Scene {
  private readonly itemsEnabled = false;
  private inputController?: InputController;
  private background?: Phaser.GameObjects.Rectangle;
  private startBackgroundPortraitImage?: Phaser.GameObjects.Image;
  private startBackgroundLandscapeImage?: Phaser.GameObjects.Image;
  private gameplayBackgroundImages: Phaser.GameObjects.Image[] = [];
  private feverBackgroundPortraitImage?: Phaser.GameObjects.Image;
  private feverBackgroundLandscapeImage?: Phaser.GameObjects.Image;
  private deskSurfaceImage?: Phaser.GameObjects.Image;
  private blurredBackgroundImages = new WeakSet<Phaser.GameObjects.Image>();
  private comboBadgeImage?: Phaser.GameObjects.Image;
  private scoreStickerImage?: Phaser.GameObjects.Image;
  private missStickerImage?: Phaser.GameObjects.Image;
  private feverBadgeImage?: Phaser.GameObjects.Image;
  private rankingPanelImage?: Phaser.GameObjects.Image;
  private rankingTitleImage?: Phaser.GameObjects.Image;
  private resultPanelImage?: Phaser.GameObjects.Image;
  private resultTitleImage?: Phaser.GameObjects.Image;
  private resultOuterPanelImage?: Phaser.GameObjects.Image;
  private resultLogoImage?: Phaser.GameObjects.Image;
  private resultSongPlateImage?: Phaser.GameObjects.Image;
  private resultDifficultyImage?: Phaser.GameObjects.Image;
  private resultScoreFrameImage?: Phaser.GameObjects.Image;
  private resultStatsPanelImage?: Phaser.GameObjects.Image;
  private resultDotDividerImage?: Phaser.GameObjects.Image;
  private settingsPanelImage?: Phaser.GameObjects.Image;
  private resultBackgroundGraphics?: Phaser.GameObjects.Graphics;
  private trackGraphics?: Phaser.GameObjects.Graphics;
  private hitboxGuideGraphics?: Phaser.GameObjects.Graphics;
  private runnerFeverGraphics?: Phaser.GameObjects.Graphics;
  private hudGraphics?: Phaser.GameObjects.Graphics;
  private feverGraphics?: Phaser.GameObjects.Graphics;
  private runners: Runner[] = [];
  private hitboxMarkers: Phaser.GameObjects.Arc[] = [];
  private jumpButtons: JumpButton[] = [];
  private titleLabel?: Phaser.GameObjects.Text;
  private sizeLabel?: Phaser.GameObjects.Text;
  private laneLabel?: Phaser.GameObjects.Text;
  private scoreLabel?: Phaser.GameObjects.Text;
  private comboLabel?: Phaser.GameObjects.Text;
  private comboMilestoneLabel?: Phaser.GameObjects.Text;
  private missLabel?: Phaser.GameObjects.Text;
  private feverLabel?: Phaser.GameObjects.Text;
  private feedbackLabel?: Phaser.GameObjects.Text;
  private startLabel?: Phaser.GameObjects.Text;
  private resultLabel?: Phaser.GameObjects.Text;
  private resultSongLabel?: Phaser.GameObjects.Text;
  private resultScoreLabel?: Phaser.GameObjects.Text;
  private resultStatsLabel?: Phaser.GameObjects.Text;
  private settingsTitleLabel?: Phaser.GameObjects.Text;
  private settingsBgmLabel?: Phaser.GameObjects.Text;
  private settingsSeLabel?: Phaser.GameObjects.Text;
  private songButtons: SongButton[] = [];
  private songSelectTitleImage?: Phaser.GameObjects.Image;
  private difficultyTitleImage?: Phaser.GameObjects.Image;
  private songSelectPaginationGraphics?: Phaser.GameObjects.Graphics;
  private songArrowButtons: SongArrowButton[] = [];
  private difficultyButtons: DifficultyButton[] = [];
  private audioSettingSliders: AudioSettingSlider[] = [];
  private resultStatParts: ResultStatPart[] = [];
  private menuButtons: MenuActionButton[] = [];
  private rankingLabels: Phaser.GameObjects.Text[] = [];
  private rankings: RankingEntry[] = [];
  private bgm?: Phaser.Sound.BaseSound;
  private menuBgm?: Phaser.Sound.BaseSound;
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
  private laneInputHistory: number[][] = Array.from({ length: GAME_BALANCE.laneCount }, () => []);
  private startTime = 0;
  private nextChartIndex = 0;
  private nextItemIndex = 0;
  private score = 0;
  private avoidCount = 0;
  private combo = 0;
  private maxCombo = 0;
  private missCount = 0;
  private perfectCount = 0;
  private goodCount = 0;
  private niceCount = 0;
  private feverActive = false;
  private finishPending = false;
  private gameStarted = false;
  private gameEnded = false;
  private menuStep: MenuStep = "start";
  private selectedSongIndex = 0;
  private selectedDifficulty: DifficultyId = "normal";
  private layoutTuning: LayoutTuningState = { ...DEFAULT_LAYOUT_TUNING };
  private hitboxOverlayEnabled = false;
  private webglFxDisabled = false;
  private audioSettings: AudioSettings = loadAudioSettings();
  private hasAudioGesture = false;
  private settingsReturnStep: SettingsReturnStep = "start";
  private activeAudioSlider?: AudioSettingKind;
  private readonly feverBackgroundState = { alpha: 0 };
  private pageAudioPaused = false;
  private htmlStartConfirmed = false;
  private unsubscribeHtmlStart?: () => void;
  private lastMissEffectAt = 0;
  private lastLayoutRefreshAt = 0;
  private lastFeverCameraBumpAt = 0;
  private readonly handleHtmlStart = () => {
    if (this.gameStarted || this.gameEnded || this.menuStep !== "start") {
      return;
    }

    this.htmlStartConfirmed = true;
    this.hasAudioGesture = true;
    this.playUiSe();
    this.showSongSelect();
  };
  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!this.gameStarted) {
      this.hasAudioGesture = true;
      if (this.gameEnded) {
        this.showStartScreen();
        return;
      }

      const pointerPosition = this.getPointerWorldPoint(pointer);
      if (
        (this.menuStep === "start" ||
          this.menuStep === "ranking" ||
          this.menuStep === "result" ||
          this.menuStep === "song" ||
          this.menuStep === "difficulty" ||
          this.menuStep === "settings") &&
        this.tryPressMenuButton(pointerPosition.x, pointerPosition.y)
      ) {
        return;
      }

      if (this.menuStep === "settings" && this.tryPressAudioSettingSlider(pointerPosition.x, pointerPosition.y)) {
        return;
      }

      if (this.menuStep === "song" && this.trySelectSong(pointerPosition.x, pointerPosition.y)) {
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

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!this.activeAudioSlider || this.menuStep !== "settings") {
      return;
    }

    const pointerPosition = this.getPointerWorldPoint(pointer);
    this.setAudioSettingFromPointer(this.activeAudioSlider, pointerPosition.x, false);
  };

  private readonly handlePointerUp = () => {
    this.activeAudioSlider = undefined;
  };
  private readonly handlePageHidden = () => {
    if (this.pageAudioPaused) {
      return;
    }

    this.pageAudioPaused = true;
    this.sound.pauseAll();
  };
  private readonly handlePageVisible = () => {
    if (!this.pageAudioPaused) {
      return;
    }

    this.pageAudioPaused = false;
    this.sound.resumeAll();
    this.applyAudioSettings(false);
  };
  private readonly handleVisibilityChange = () => {
    if (typeof document !== "undefined" && document.hidden) {
      this.handlePageHidden();
      return;
    }

    this.handlePageVisible();
  };
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    if (!this.gameStarted) {
      this.hasAudioGesture = true;
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      event.preventDefault();
      if (!this.gameStarted) {
        if (this.gameEnded) {
          this.playUiSe();
          this.showStartScreen();
        } else if (this.menuStep === "song") {
          this.playUiSe();
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
          this.playUiSe();
          this.showStartScreen();
        } else if (this.menuStep === "song") {
          this.playUiSe();
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
          this.playUiSe();
          this.showStartScreen();
        } else if (this.menuStep === "song") {
          this.playUiSe();
          this.browseSongByOffset(1);
        }
        return;
      }
      this.jumpRunner(2);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "start" && (event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      if (!this.htmlStartConfirmed) {
        return;
      }
      this.playUiSe();
      this.showSongSelect();
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "ranking" && (event.code === "Escape" || event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      this.playUiSe();
      this.showStartScreen();
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "result") {
      if (event.code === "Escape") {
        event.preventDefault();
        this.playUiSe();
        this.showStartScreen();
        return;
      }

      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        this.playUiSe();
        this.startRun();
        return;
      }
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "settings" && event.code === "Escape") {
      event.preventDefault();
      this.playUiSe();
      this.closeSettingsScreen();
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
      this.playUiSe();
      this.selectDifficulty(nextDifficulty);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "song" && (event.code === "KeyQ" || event.code === "KeyE")) {
      event.preventDefault();
      this.playUiSe();
      this.browseSongByOffset(event.code === "KeyQ" ? -1 : 1);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "song" && event.code === "Escape") {
      event.preventDefault();
      this.playUiSe();
      this.showStartScreen();
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "song" && (event.code === "Enter" || event.code === "Space")) {
      event.preventDefault();
      this.playUiSe();
      this.selectSong(this.selectedSongIndex);
      return;
    }

    if (!this.gameStarted && !this.gameEnded && this.menuStep === "difficulty") {
      if (event.code === "Escape") {
        event.preventDefault();
        this.playUiSe();
        this.showSongSelect();
        return;
      }

      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        this.playUiSe();
        this.startRun();
        return;
      }

    }
  };

  constructor() {
    super("MainScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
    this.hitboxOverlayEnabled = this.isHitboxOverlayMode();
    this.inputController = new InputController(this);
    this.sound.pauseOnBlur = true;
    this.createPrototypeView();
    this.loadRankings();
    this.createMenuBgm();
    this.createSelectedBgm();
    this.moveSe = this.createSoundIfLoaded("se_move_beat", { volume: this.getSeVolume(MOVE_SE_BASE_VOLUME) });
    this.itemSe = this.createSoundIfLoaded("se_item_collect", { volume: this.getSeVolume(ITEM_SE_BASE_VOLUME) });
    this.redPerformanceSe = this.createSoundIfLoaded("se_character_red", { volume: this.getSeVolume(PERFORMANCE_SE_BASE_VOLUME) });
    this.yellowPerformanceSe = this.createSoundIfLoaded("se_character_yellow", { volume: this.getSeVolume(PERFORMANCE_SE_BASE_VOLUME) });
    this.bluePerformanceSe = this.createSoundIfLoaded("se_character_blue", { volume: this.getSeVolume(PERFORMANCE_SE_BASE_VOLUME) });
    this.applyAudioSettings(false);
    this.loadChart();
    this.layout();
    this.input.addPointer(GAME_BALANCE.laneCount - 1);
    this.input.keyboard?.on("keydown", this.handleKeyDown);
    this.input.on("pointerdown", this.handlePointerDown);
    this.input.on("pointermove", this.handlePointerMove);
    this.input.on("pointerup", this.handlePointerUp);
    this.input.on("pointerupoutside", this.handlePointerUp);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.registerPageAudioHandlers();
    this.unsubscribeHtmlStart = gameEvents.on("ui:start", this.handleHtmlStart);
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
      this.updateItems();
    }
    this.updateObstacles();
    const track = this.getTrackLayout();
    this.layoutBackgroundImages(track);
    this.drawTrack(track);
    this.layoutPlayers(track);
    this.layoutHitboxOverlay(track);
    if (this.feverActive) {
      this.drawFeverLayer();
      this.updateFeverCameraBump();
    }
    this.drawRunnerFeverLayer();
  }

  private createPrototypeView() {
    const theme = this.currentTheme;
    this.background = this.add.rectangle(0, 0, 1, 1, this.themeColor("background")).setOrigin(0).setDepth(-32);
    this.startBackgroundPortraitImage = this.createThemeImage(this.currentThemeAssets.background.start.portrait, 0, 0, -30);
    this.startBackgroundLandscapeImage = this.createThemeImage(this.currentThemeAssets.background.start.landscape, 0, 0, -30);
    this.gameplayBackgroundImages = [0, 1].flatMap(() => {
      const normalAssets = this.getThemeAssetsById(NORMAL_GAMEPLAY_THEME_ID);
      const assetKey = this.isPortrait ? normalAssets.background.gameplay.portrait : normalAssets.background.gameplay.landscape;
      const image = this.createThemeImage(assetKey, 0, 0, -28);
      return image ? [image] : [];
    });
    this.feverBackgroundPortraitImage = this.createThemeImage(this.getThemeAssetsById(FEVER_GAMEPLAY_THEME_ID).background.fever.portrait, 0, 0, -27);
    this.feverBackgroundLandscapeImage = this.createThemeImage(this.getThemeAssetsById(FEVER_GAMEPLAY_THEME_ID).background.fever.landscape, 0, 0, -27);
    this.deskSurfaceImage = this.createThemeImage(this.currentThemeAssets.background.decoration[0], 0, 0, -29);
    this.comboBadgeImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudCombo, 0, 0, 299.5);
    this.scoreStickerImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudScore, 0, 0, 299.5);
    this.missStickerImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudMiss, 0, 0, 299.5);
    this.feverBadgeImage = this.createThemeImage(this.currentThemeAssets.ui.parts.hudFever, 0, 0, 299.5);
    this.rankingPanelImage = this.createThemeImage(this.currentThemeAssets.ui.parts.rankingPanel, 0, 0, 314);
    this.rankingTitleImage = this.createThemeImage(this.currentThemeAssets.ui.parts.rankingTitle, 0, 0, 315);
    this.resultPanelImage = this.createThemeImage(this.currentThemeAssets.ui.parts.rankingPanel, 0, 0, 314);
    this.resultOuterPanelImage = this.createThemeImage("tinytoy_ui_part_result_minimal_outer_panel_01", 0, 0, 314);
    this.resultLogoImage = this.createThemeImage("tinytoy_ui_part_result_minimal_logo_01", 0, 0, 315);
    this.resultTitleImage = this.createThemeImage("tinytoy_ui_part_result_minimal_title_01", 0, 0, 316);
    this.resultSongPlateImage = this.createThemeImage("tinytoy_ui_part_result_minimal_song_plate_01", 0, 0, 316);
    this.resultDifficultyImage = this.createThemeImage("tinytoy_ui_part_result_minimal_difficulty_normal_01", 0, 0, 317);
    this.resultScoreFrameImage = this.createThemeImage("tinytoy_ui_part_result_minimal_score_frame_01", 0, 0, 316);
    this.resultStatsPanelImage = this.createThemeImage("tinytoy_ui_part_result_minimal_stats_panel_01", 0, 0, 316);
    this.resultDotDividerImage = this.createThemeImage("tinytoy_ui_part_result_minimal_dot_divider_01", 0, 0, 316);
    this.resultBackgroundGraphics = this.add.graphics().setDepth(313);
    this.resultStatParts = [
      ["score", "tinytoy_ui_part_result_minimal_score_frame_01"],
      ["maxCombo", "tinytoy_ui_part_result_minimal_stat_max_combo_01"],
      ["perfect", "tinytoy_ui_part_result_minimal_stat_perfect_01"],
      ["good", "tinytoy_ui_part_result_minimal_stat_good_01"],
      ["nice", "tinytoy_ui_part_result_minimal_stat_nice_01"],
      ["miss", "tinytoy_ui_part_result_minimal_stat_miss_01"]
    ].map(([kind, assetKey]) => {
      const image = this.createThemeImage(assetKey, 0, 0, 326);
      const label = this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "right"
        })
        .setOrigin(1, 0.5)
        .setAlpha(0)
        .setDepth(327);
      return { kind: kind as ResultStatKind, image, label };
    });
    this.settingsPanelImage = this.createThemeImage(this.currentThemeAssets.ui.parts.nameInputPanel, 0, 0, 314);
    this.trackGraphics = this.add.graphics().setDepth(1);
    this.hitboxGuideGraphics = this.add.graphics().setDepth(388);
    this.runnerFeverGraphics = this.add.graphics().setDepth(151);
    this.hudGraphics = this.add.graphics().setDepth(299);
    this.feverGraphics = this.add.graphics().setDepth(298);

    this.runners = Array.from({ length: GAME_BALANCE.laneCount }, (_, lane) => {
      const shadow = this.add.ellipse(0, 58, 124, 34, this.themeColor("shadow"), 0);
      shadow.setVisible(false);
      const body = this.add.ellipse(0, 0, 44, 54, this.runnerColor(lane));
      const face = this.add.ellipse(0, -8, 24, 20, this.themeColor("background"));
      const assetImage = this.createRunnerAssetImage(lane);
      const containerChildren: Phaser.GameObjects.GameObject[] = [body, face];
      if (assetImage) {
        containerChildren.push(assetImage);
      }
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

    this.hitboxMarkers = Array.from({ length: GAME_BALANCE.laneCount }, (_, lane) =>
      this.add.circle(0, 0, 1, this.runnerColor(lane), 0).setStrokeStyle(0, 0xffffff, 0).setDepth(389).setVisible(false)
    );

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

    this.comboMilestoneLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.primary,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(302);

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

    this.resultSongLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330);

    this.resultScoreLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(331);

    this.resultStatsLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330)
      .setLineSpacing(7);

    this.settingsTitleLabel = this.add
      .text(0, 0, "SOUND", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.accent,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330);

    this.settingsBgmLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330);

    this.settingsSeLabel = this.add
      .text(0, 0, "", {
        fontFamily: UI_FONT,
        fontStyle: "900",
        color: theme.colors.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(330);

    this.songSelectTitleImage = this.createThemeImage(this.currentThemeAssets.ui.parts.titleBanner, 0, 0, 315);
    this.difficultyTitleImage = this.createThemeImage(this.currentThemeAssets.ui.parts.titleLevelBanner, 0, 0, 315);
    this.songSelectPaginationGraphics = this.add.graphics().setDepth(316);
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

    this.songButtons = SONGS.map((song, index) => {
      const cardAssetKey = index % 2 === 0 ? this.currentThemeAssets.ui.parts.songCardLarge : this.currentThemeAssets.ui.parts.songCardSide;
      const background = this.add.rectangle(0, 0, 1, 1, this.themeColor("track"), 0.95).setDepth(313);
      const assetImage = this.createThemeImage(cardAssetKey, 0, 0, 316);
      const sideAssetImage = this.createThemeImage(cardAssetKey, 0, 0, 316);
      const thumbnail = this.add.rectangle(0, 0, 1, 1, this.themeColor("rightLane"), 0.92).setDepth(314.8);
      const thumbnailAccent = this.add.rectangle(0, 0, 1, 1, this.themeColor("accent"), 0.82).setDepth(314.9);
      const thumbnailImage = song.thumbnailKey ? this.add.image(0, 0, song.thumbnailKey).setDepth(315) : undefined;
      const thumbnailMaskGraphics = this.make.graphics({ x: 0, y: 0 });
      const thumbnailMask = thumbnailMaskGraphics.createGeometryMask();
      thumbnail.setMask(thumbnailMask);
      thumbnailAccent.setMask(thumbnailMask);
      thumbnailImage?.setMask(thumbnailMask);
      const indexLabel = this.add
        .text(0, 0, "01", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.accent,
          align: "left"
        })
        .setOrigin(0, 0.5)
        .setDepth(317);
      const label = this.add
        .text(0, 0, song.shortTitle, {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(317);
      const metaLabel = this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT,
          fontStyle: "800",
          color: theme.colors.text,
          align: "left"
        })
        .setOrigin(0, 0.5)
        .setDepth(317);
      const starLabel = this.add
        .text(0, 0, "★ ★ ★ ☆ ☆", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.accent,
          align: "left"
        })
        .setOrigin(0, 0.5)
        .setDepth(317);
      background.setStrokeStyle(2, this.themeColor("line"), 0.65);

      return { song, background, thumbnail, thumbnailAccent, thumbnailImage, thumbnailMaskGraphics, label, assetImage, sideAssetImage, metaLabel, indexLabel, starLabel };
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

    this.audioSettingSliders = (["bgm", "se"] as AudioSettingKind[]).map((kind) => {
      const track = this.add.graphics().setDepth(331);
      const fill = this.add.graphics().setDepth(332);
      const knob = this.add.graphics().setDepth(333);
      const trackHit = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0).setDepth(330);
      const knobHit = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0).setDepth(330);
      const label = this.add
        .text(0, 0, kind.toUpperCase(), {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.text,
          align: "center"
        })
        .setOrigin(0.5)
        .setDepth(333);
      const valueLabel = this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT,
          fontStyle: "900",
          color: theme.colors.primary,
          align: "right"
        })
        .setOrigin(1, 0.5)
        .setDepth(333);

      return { kind, track, fill, knob, trackHit, knobHit, label, valueLabel };
    });

    this.menuButtons = [
      { action: "play" as const, text: "START", assetKey: this.currentThemeAssets.ui.parts.buttonPrimary, pressedAssetKey: this.currentThemeAssets.ui.parts.buttonPrimaryPressed },
      { action: "ranking" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconTrophy, pressedAssetKey: this.currentThemeAssets.ui.parts.iconTrophyPressed },
      { action: "setting" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconGear, pressedAssetKey: this.currentThemeAssets.ui.parts.iconGearPressed },
      { action: "help" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconHelp, pressedAssetKey: this.currentThemeAssets.ui.parts.iconHelpPressed },
      { action: "back" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.arrowLeft, pressedAssetKey: this.currentThemeAssets.ui.parts.arrowLeftPressed },
      { action: "home" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconHome, pressedAssetKey: this.currentThemeAssets.ui.parts.iconHome },
      { action: "retry" as const, text: "", assetKey: this.currentThemeAssets.ui.parts.iconRetry, pressedAssetKey: this.currentThemeAssets.ui.parts.iconRetryPressed }
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
      this.drawFeverLayer();
      this.layoutPlayers(track);
      this.drawRunnerFeverLayer();
      this.layoutHitboxOverlay(track);
      this.setRunnersVisible(true);
      this.layoutObstacles(track);
      if (this.itemsEnabled) {
        this.layoutItems(track);
      }
    } else {
      this.drawMenuBackground();
      this.trackGraphics?.setAlpha(1);
      this.feverGraphics?.clear();
      this.runnerFeverGraphics?.clear();
      this.layoutHitboxOverlay(track);
      this.setRunnersVisible(false);
    }
    this.layoutJumpButtons();
    this.drawHudStickers();
    this.layoutHudAssetImages();

    const usesDesignedMenuTitle =
      !this.gameStarted &&
      !this.gameEnded &&
      (this.menuStep === "start" ||
        this.menuStep === "song" ||
        this.menuStep === "difficulty" ||
        this.menuStep === "ranking" ||
        this.menuStep === "result" ||
        this.menuStep === "settings");

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
      .setPosition((88 + HUD_LEFT_NUMBER_X_OFFSET) * Math.max(screenScale, 0.94), (181 + HUD_NUMBER_Y_OFFSET) * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(29 * Math.max(screenScale, 0.94), 24, 36)))
      .setAlign("center")
      .setColor(HUD_NUMBER_COLOR)
      .setStroke(theme.colors.line, Math.round(5 * Math.max(screenScale, 0.94)))
      .setLineSpacing(-5 * Math.max(screenScale, 0.94))
      .setText(`${this.combo}`)
      .setDepth(301)
      .setAlpha(this.gameStarted || this.gameEnded ? 1 : 0);

    this.comboMilestoneLabel
      ?.setPosition((88 + HUD_LEFT_NUMBER_X_OFFSET) * Math.max(screenScale, 0.94), (226 + HUD_NUMBER_Y_OFFSET) * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(14 * Math.max(screenScale, 0.94), 12, 18)))
      .setColor(this.combo >= 50 ? theme.colors.accent : theme.colors.primary)
      .setStroke(theme.colors.line, Math.round(3 * Math.max(screenScale, 0.94)))
      .setAlpha(this.gameStarted && this.combo >= 10 ? 1 : 0);

    this.scoreLabel
      ?.setOrigin(0.5)
      .setPosition((86 + HUD_LEFT_NUMBER_X_OFFSET) * Math.max(screenScale, 0.94), (64 + HUD_NUMBER_Y_OFFSET) * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(27 * Math.max(screenScale, 0.94), 23, 34)))
      .setAlign("center")
      .setColor(HUD_NUMBER_COLOR)
      .setStroke(theme.colors.line, Math.round(6 * Math.max(screenScale, 0.94)))
      .setLineSpacing(-4 * Math.max(screenScale, 0.94))
      .setText(this.score.toString().padStart(6, "0"))
      .setDepth(300)
      .setAlpha(this.gameStarted || this.gameEnded ? 1 : 0);

    this.missLabel
      ?.setOrigin(0.5)
      .setPosition(width - (82 + HUD_RIGHT_NUMBER_X_OFFSET) * Math.max(screenScale, 0.94), (64 + HUD_NUMBER_Y_OFFSET) * Math.max(screenScale, 0.94))
      .setFontSize(Math.round(Phaser.Math.Clamp(27 * Math.max(screenScale, 0.94), 23, 34)))
      .setAlign("center")
      .setColor(HUD_NUMBER_COLOR)
      .setStroke(theme.colors.line, Math.round(6 * Math.max(screenScale, 0.94)))
      .setLineSpacing(-4 * Math.max(screenScale, 0.94))
      .setText(this.missCount.toString().padStart(3, "0"))
      .setAlpha(this.gameStarted || this.gameEnded ? 1 : 0);

    this.feverLabel
      ?.setPosition(width / 2, height * (this.isPortrait ? 0.28 : 0.34))
      .setFontSize(Math.round(Phaser.Math.Clamp(58 * screenScale, 46, 86)));

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
    this.layoutRankingLabels();
    this.layoutResultPage();
    this.layoutSettingsPage();
    this.layoutMenuButtons();

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

    if (this.menuStep === "result") {
      return "";
    }

    if (this.menuStep === "settings") {
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
    const shouldBlurMenuBackground = isMenuScreen && (this.menuStep === "song" || this.menuStep === "difficulty" || this.menuStep === "result");
    const showGameBackground = !isSimpleStartScreen;
    this.layoutCoverBackgroundImage(this.startBackgroundPortraitImage, isSimpleStartScreen && this.isPortrait);
    this.layoutCoverBackgroundImage(this.startBackgroundLandscapeImage, isSimpleStartScreen && !this.isPortrait);
    this.layoutGameplayScrollingBackground(showGameBackground);
    this.layoutFeverBackgroundImage(this.feverBackgroundPortraitImage, showGameBackground && this.isPortrait);
    this.layoutFeverBackgroundImage(this.feverBackgroundLandscapeImage, showGameBackground && !this.isPortrait);

    this.deskSurfaceImage
      ?.setPosition(width / 2, height / 2)
      .setDisplaySize(width, height)
      .setAlpha(showGameBackground ? (this.gameStarted ? 0.16 : 0.42) : 0)
      .setVisible(showGameBackground);

    this.applyMenuBackgroundBlur(shouldBlurMenuBackground);
  }

  private applyMenuBackgroundBlur(shouldBlur: boolean) {
    [
      this.deskSurfaceImage,
      ...this.gameplayBackgroundImages
    ].forEach((image) => this.setBackgroundImageBlur(image, shouldBlur));
  }

  private setBackgroundImageBlur(image: Phaser.GameObjects.Image | undefined, shouldBlur: boolean) {
    if (!image?.preFX || this.shouldDisableWebglFx()) {
      if (this.blurredBackgroundImages.has(image as Phaser.GameObjects.Image)) {
        image?.preFX?.clear();
        this.blurredBackgroundImages.delete(image as Phaser.GameObjects.Image);
      }
      return;
    }

    const isBlurred = this.blurredBackgroundImages.has(image);
    if (shouldBlur && !isBlurred) {
      try {
        image.preFX.clear();
        image.preFX.addBlur(1, 2, 2, 1.25, 0xffffff, 4);
        this.blurredBackgroundImages.add(image);
      } catch (error) {
        console.warn("[BEAT RUNNER] WebGL FX disabled after blur setup failed.", error);
        this.webglFxDisabled = true;
        image.preFX.clear();
      }
      return;
    }

    if (!shouldBlur && isBlurred) {
      image.preFX.clear();
      this.blurredBackgroundImages.delete(image);
    }
  }

  private shouldDisableWebglFx() {
    if (this.webglFxDisabled) {
      return true;
    }

    if (typeof navigator === "undefined") {
      return false;
    }

    return /Android/i.test(navigator.userAgent);
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
    const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
    const displayWidth = sourceWidth * coverScale;
    const displayHeight = sourceHeight * coverScale;

    images.forEach((image, index) => {
      image
        .setPosition(width / 2, height / 2)
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

  private layoutFeverBackgroundImage(image: Phaser.GameObjects.Image | undefined, isActiveOrientation: boolean) {
    if (!image) {
      return;
    }

    const { width, height } = this.scale;
    const texture = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const sourceWidth = texture.width || width;
    const sourceHeight = texture.height || height;
    const scale = Math.max(width / sourceWidth, height / sourceHeight) * (1 + this.layoutTuning.bgScale * 0.035);
    const alpha = isActiveOrientation ? this.feverBackgroundState.alpha : 0;
    const x = width / 2 + width * this.layoutTuning.bgX * 0.01;
    const y = height / 2 + height * this.layoutTuning.bgY * 0.01;

    image
      .setPosition(x, y)
      .setDisplaySize(sourceWidth * scale, sourceHeight * scale)
      .setAlpha(alpha)
      .setVisible(alpha > 0.01);
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

    if (this.menuStep === "result") {
      return `${this.selectedSong.shortTitle} / ${DIFFICULTY_SETTINGS[this.selectedDifficulty].label}`;
    }

    if (this.menuStep === "settings") {
      return "AUDIO MIX";
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
    const isDesktopLandscape = this.isDesktopLandscape;
    const isStartScreen = this.menuStep === "start" && !this.gameStarted && !this.gameEnded;
    const isSongScreen = this.menuStep === "song" && !this.gameStarted && !this.gameEnded;
    const isDifficultyScreen = this.menuStep === "difficulty" && !this.gameStarted && !this.gameEnded;
    const isResultScreen = this.menuStep === "result" && !this.gameStarted && !this.gameEnded;
    const isSettingsScreen = this.menuStep === "settings" && !this.gameStarted && !this.gameEnded;
    const startButtonScale = isStartScreen ? Math.max(screenScale, this.isPortrait ? 1 : 0.9) : screenScale;
    const buttonWidth = isStartScreen
      ? Math.min(width * (this.isPortrait ? 0.78 : 0.34), 420 * startButtonScale)
      : isDifficultyScreen
        ? Math.min(width * (this.isPortrait ? 0.68 : isDesktopLandscape ? 0.26 : 0.3), (isDesktopLandscape ? 300 : 350) * Math.max(screenScale, 0.9))
        : Math.min(width * 0.72, 280 * screenScale);
    const buttonHeight = isStartScreen ? 82 * startButtonScale : isDifficultyScreen ? (isDesktopLandscape ? 58 : 68) * Math.max(screenScale, 0.9) : 54 * screenScale;
    const difficultyStartButtonWidth = Math.min(width * (this.isPortrait ? 0.78 : isDesktopLandscape ? 0.28 : 0.34), (isDesktopLandscape ? 300 : 420) * Math.max(screenScale, 0.9));
    const difficultyStartButtonHeight = (isDesktopLandscape ? 64 : 82) * Math.max(screenScale, 0.9);
    const iconSize = Math.round(Phaser.Math.Clamp(68 * startButtonScale, 58, this.isPortrait ? 82 : 76));
    const textSize = Math.round(Phaser.Math.Clamp((isStartScreen ? 27 : isDifficultyScreen ? 25 : 18) * Math.max(startButtonScale, 0.9), 15, 36));
    const centerX = width / 2;
    const startY = isStartScreen ? height * (this.isPortrait ? 0.805 : 0.83) : isDifficultyScreen ? height * (this.isPortrait ? 0.73 : isDesktopLandscape ? 0.83 : 0.7) : height * 0.55;
    const iconY = isStartScreen ? height * (this.isPortrait ? 0.86 : 0.88) : startY + 78 * startButtonScale;
    const iconGap = iconSize * (this.isPortrait ? 1.36 : 1.48);

    this.menuButtons.forEach((button) => {
      const isIconAction = button.action === "setting";
      const isStartButton = this.menuStep === "start" && button.action === "play";
      const isSongSettingButton = isSongScreen && button.action === "setting";
      const isDifficultySettingButton = isDifficultyScreen && button.action === "setting";
      const isResultSettingButton = isResultScreen && button.action === "setting";
      const isDifficultyStartButton = isDifficultyScreen && button.action === "play";
      const isBackButton = isDifficultyScreen && button.action === "back";
      const isSettingsBackButton = isSettingsScreen && button.action === "back";
      const isRankingUtilityButton = this.menuStep === "ranking" && (button.action === "home" || button.action === "retry");
      const isResultUtilityButton = isResultScreen && (button.action === "home" || button.action === "retry");
      const isVisible =
        !this.gameStarted &&
        !this.gameEnded &&
        (isStartButton ||
          isSongSettingButton ||
          isDifficultySettingButton ||
          isResultSettingButton ||
          isDifficultyStartButton ||
          isBackButton ||
          isSettingsBackButton ||
          isRankingUtilityButton ||
          isResultUtilityButton);
      const isDifficultyBackButton = button.action === "back" && isDifficultyScreen;
      const isAnyBackButton = isDifficultyBackButton || isSettingsBackButton;
      const isTopLeftSettingButton = isSongSettingButton || isDifficultySettingButton || isResultSettingButton;
      const backButtonSize = Math.round(Phaser.Math.Clamp(58 * Math.max(screenScale, 0.9), 52, 72));
      const rankingUtilityButtonSize = Math.round(Phaser.Math.Clamp(76 * Math.max(screenScale, 0.9), 66, 84));
      const songSettingButtonSize = Math.round(Phaser.Math.Clamp(58 * Math.max(screenScale, 0.9), 52, 72));
      const topLeftSettingX = 22 * Math.max(screenScale, 0.9) + songSettingButtonSize / 2;
      const topLeftSettingY = 22 * Math.max(screenScale, 0.9) + songSettingButtonSize / 2;
      const difficultyButtonGap = 12 * Math.max(screenScale, 0.9);
      const difficultyCardsTotalWidth = isDesktopLandscape ? Math.min(width * 0.46, 340) : Math.min(width * 0.9, 390 * Math.max(screenScale, 0.9));
      const difficultyBackX = this.isPortrait
        ? centerX - difficultyCardsTotalWidth / 2 + backButtonSize / 2
        : centerX - difficultyStartButtonWidth / 2 - difficultyButtonGap - backButtonSize / 2;
      const rankingUtilityGap = rankingUtilityButtonSize * 1.24;
      const rankingPanelBottom = this.rankingPanelImage
        ? this.rankingPanelImage.y + this.rankingPanelImage.displayHeight / 2
        : height * (this.isPortrait ? 0.675 : 0.655);
      const resultUtilityGap = rankingUtilityButtonSize * (isDesktopLandscape ? 1.72 : 1.42);
      const settingsPanelLeft = this.settingsPanelImage ? this.settingsPanelImage.x - this.settingsPanelImage.displayWidth / 2 : width * 0.12;
      const x = isResultUtilityButton
        ? centerX + (button.action === "home" ? -resultUtilityGap / 2 : resultUtilityGap / 2)
        : isRankingUtilityButton
        ? centerX + (button.action === "home" ? -rankingUtilityGap / 2 : rankingUtilityGap / 2)
        : isSettingsBackButton
          ? settingsPanelLeft + backButtonSize * 0.8
        : isDifficultyBackButton
          ? difficultyBackX
        : isTopLeftSettingButton
          ? topLeftSettingX
        : isStartScreen && isIconAction
          ? centerX + (button.action === "ranking" ? -iconGap : button.action === "help" ? iconGap : 0)
          : centerX;
      const y =
        button.action === "play"
          ? startY
          : isSettingsBackButton
            ? height * (this.isPortrait ? 0.27 : 0.24)
          : isDifficultyBackButton
            ? startY
          : isResultUtilityButton
            ? height * (this.isPortrait ? 0.915 : 0.89) + (this.isDesktopLandscape ? this.layoutTuning.resultBottomY * 3 * screenScale : 0)
          : isRankingUtilityButton
            ? rankingPanelBottom + 18 * Math.max(screenScale, 0.9) + rankingUtilityButtonSize / 2
            : isTopLeftSettingButton
              ? topLeftSettingY
            : isIconAction
            ? iconY
            : height * 0.84;
      const fillColor = button.action === "play" ? this.themeColor("secondary") : this.themeColor("trackAlt");
      const textColor = theme.colors.text;
      const displayWidth = isResultUtilityButton
        ? rankingUtilityButtonSize
        : isRankingUtilityButton
        ? rankingUtilityButtonSize
        : isAnyBackButton
          ? backButtonSize
          : isTopLeftSettingButton
            ? songSettingButtonSize
            : isStartScreen && isIconAction
              ? iconSize
              : isDifficultyStartButton
                ? difficultyStartButtonWidth
                : buttonWidth;
      const displayHeight = isResultUtilityButton
        ? rankingUtilityButtonSize
        : isRankingUtilityButton
        ? rankingUtilityButtonSize
        : isAnyBackButton
          ? backButtonSize
          : isTopLeftSettingButton
            ? songSettingButtonSize
            : isStartScreen && isIconAction
              ? iconSize
              : isDifficultyStartButton
                ? difficultyStartButtonHeight
                : buttonHeight;
      const imageWidth = isResultUtilityButton || isRankingUtilityButton || isAnyBackButton || isTopLeftSettingButton || (isStartScreen && isIconAction) ? displayWidth : displayWidth * 1.08;
      const imageHeight = isResultUtilityButton || isRankingUtilityButton || isAnyBackButton || isTopLeftSettingButton || (isStartScreen && isIconAction) ? displayHeight : displayHeight * 1.18;

      if (isResultUtilityButton) {
        const resultButtonAsset =
          button.action === "home"
            ? "tinytoy_ui_part_result_minimal_button_home_01"
            : "tinytoy_ui_part_result_minimal_button_retry_01";
        button.assetImage?.setTexture(resultButtonAsset);
        button.pressedAssetImage?.setTexture(resultButtonAsset);
      }

      if (isAnyBackButton) {
        button.assetImage?.setTexture(this.currentThemeAssets.ui.parts.arrowLeft);
        button.pressedAssetImage?.setTexture(this.currentThemeAssets.ui.parts.arrowLeftPressed);
      }

      button.background
        .setPosition(x, y)
        .setSize(displayWidth, displayHeight)
        .setFillStyle(fillColor, button.assetImage ? 0 : isVisible ? 0.95 : 0)
        .setStrokeStyle(2 * screenScale, button.action === "play" ? this.themeColor("line") : this.themeColor("primary"), button.assetImage ? 0 : isVisible ? 0.75 : 0)
        .setAlpha(isVisible ? 1 : 0);
      button.assetImage
        ?.setPosition(x, y)
        .setAlpha(isVisible ? 0.95 : 0)
        .setVisible(isVisible);
      this.fitImageInBox(button.assetImage, imageWidth, imageHeight);
      button.pressedAssetImage
        ?.setPosition(x, y)
        .setAlpha(0)
        .setVisible(isVisible);
      this.fitImageInBox(button.pressedAssetImage, imageWidth, imageHeight);
      button.label
        .setPosition(x, y)
        .setFontSize(isAnyBackButton || isTopLeftSettingButton ? Math.round(Phaser.Math.Clamp(16 * Math.max(screenScale, 0.9), 13, 20)) : textSize)
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

  private layoutResultPage() {
    const { width, height } = this.scale;
    const screenScale = Math.max(this.screenScale, 0.9);
    const isVisible = !this.gameStarted && !this.gameEnded && this.menuStep === "result";
    const isDesktopResult = this.isDesktopLandscape;
    const basePanelWidth = isDesktopResult
      ? Math.min(width * 0.92, 900 * screenScale)
      : Math.min(width * (this.isPortrait ? 0.96 : 0.54), this.isPortrait ? 430 * screenScale : 500 * screenScale);
    const resultBackgroundScale = isDesktopResult ? Phaser.Math.Clamp(1 + this.layoutTuning.resultBgScale * 0.012, 0.74, 1.28) : 1;
    const panelWidth = basePanelWidth * resultBackgroundScale;
    const panelHeight =
      (isDesktopResult ? Math.min(height * 0.72, 392 * screenScale) : Math.min(height * (this.isPortrait ? 0.965 : 0.92), basePanelWidth * 1.98)) *
      resultBackgroundScale;
    const panelX = width / 2 + (isDesktopResult ? this.layoutTuning.resultBgX * 3 * screenScale : 0);
    const panelY = (isDesktopResult ? height * 0.61 : height / 2) + (isDesktopResult ? this.layoutTuning.resultBgY * 3 * screenScale : 0);
    const panelTop = panelY - panelHeight / 2;
    const contentWidth = panelWidth * (isDesktopResult ? 0.84 : 0.82);
    const leftColumnX = isDesktopResult ? panelX - panelWidth * 0.235 + this.layoutTuning.resultLeftX * 3 * screenScale : panelX;
    const rightColumnX = isDesktopResult ? panelX + panelWidth * 0.215 + this.layoutTuning.resultRightX * 3 * screenScale : panelX;
    const leftColumnWidth = isDesktopResult ? panelWidth * Phaser.Math.Clamp(0.5 + this.layoutTuning.resultLeftW * 0.012, 0.36, 0.64) : contentWidth;
    const rightColumnWidth = isDesktopResult ? panelWidth * 0.37 : contentWidth;
    const logoY = isDesktopResult ? panelTop - panelHeight * 0.22 : panelTop + panelHeight * 0.07;
    const titleY = isDesktopResult ? panelTop - panelHeight * 0.08 : panelTop + panelHeight * 0.155;
    const resultTitleX = isDesktopResult ? panelX + this.layoutTuning.resultTitleX * 3 * screenScale : panelX;
    const resultTitleY = isDesktopResult ? titleY + this.layoutTuning.resultTitleY * 3 * screenScale : titleY;
    const songY = isDesktopResult ? panelTop + panelHeight * 0.30 + this.layoutTuning.resultSongY * 3 * screenScale : panelTop + panelHeight * 0.275;
    const songScale = isDesktopResult ? Phaser.Math.Clamp(1 + this.layoutTuning.resultSongS * 0.012, 0.75, 1.32) : 1;
    const difficultyX = leftColumnX + leftColumnWidth * songScale * 0.39 + (isDesktopResult ? this.layoutTuning.resultDifficultyX * 3 * screenScale : 0);
    const difficultyY = songY + (isDesktopResult ? this.layoutTuning.resultDifficultyY * 3 * screenScale : 0);
    const difficultyScale = isDesktopResult ? Phaser.Math.Clamp(1 + this.layoutTuning.resultDifficultyS * 0.012, 0.68, 1.42) : 1;
    const scoreY = isDesktopResult ? panelTop + panelHeight * 0.595 + this.layoutTuning.resultScoreY * 3 * screenScale : panelTop + panelHeight * 0.425;
    const scoreX = isDesktopResult ? leftColumnX + this.layoutTuning.resultScoreX * 3 * screenScale : leftColumnX;
    const scoreScale = isDesktopResult ? Phaser.Math.Clamp(1 + this.layoutTuning.resultScoreS * 0.012, 0.72, 1.32) : 1;
    const scoreWidth = isDesktopResult ? leftColumnWidth * scoreScale : leftColumnWidth;
    const statsY = isDesktopResult ? panelTop + panelHeight * 0.475 + this.layoutTuning.resultStatY * 3 * screenScale : panelTop + panelHeight * 0.64;
    const dividerY = isDesktopResult ? panelTop + panelHeight * 0.82 + this.layoutTuning.resultBottomY * 3 * screenScale : panelTop + panelHeight * 0.872;
    const dividerLeft = panelX - contentWidth * 0.5;
    const dividerRight = panelX + contentWidth * 0.5;
    const dividerWidth = dividerRight - dividerLeft;
    const dividerX = (dividerLeft + dividerRight) / 2;
    const panelRadius = Math.round(28 * screenScale);
    const panelLeft = panelX - panelWidth / 2;
    const panelTopY = panelY - panelHeight / 2;
    const panelTopExtension = isDesktopResult ? 24 * screenScale : 0;
    const visualPanelTopY = panelTopY - panelTopExtension;
    const visualPanelHeight = panelHeight + panelTopExtension;

    this.resultBackgroundGraphics?.clear();
    if (isVisible && this.resultBackgroundGraphics) {
      this.resultBackgroundGraphics
        .fillStyle(0x7d4d24, 0.18)
        .fillRoundedRect(panelLeft + 5 * screenScale, visualPanelTopY + 7 * screenScale, panelWidth, visualPanelHeight, panelRadius)
        .fillStyle(0xfff1cf, 0.93)
        .fillRoundedRect(panelLeft, visualPanelTopY, panelWidth, visualPanelHeight, panelRadius)
        .lineStyle(Math.max(2, 4 * screenScale), 0xffffff, 0.95)
        .strokeRoundedRect(panelLeft + 4 * screenScale, visualPanelTopY + 4 * screenScale, panelWidth - 8 * screenScale, visualPanelHeight - 8 * screenScale, panelRadius - 4 * screenScale)
        .lineStyle(Math.max(2, 3 * screenScale), 0xd8a951, 0.82)
        .strokeRoundedRect(panelLeft + 10 * screenScale, visualPanelTopY + 10 * screenScale, panelWidth - 20 * screenScale, visualPanelHeight - 20 * screenScale, panelRadius - 10 * screenScale);
    }

    this.resultOuterPanelImage
      ?.setPosition(panelX, panelY)
      .setDisplaySize(panelWidth, panelHeight)
      .setAlpha(0)
      .setVisible(false);

    this.resultLogoImage
      ?.setPosition(panelX, logoY)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(this.resultLogoImage, panelWidth * (isDesktopResult ? 0.24 : 0.42), panelHeight * (isDesktopResult ? 0.16 : 0.09));

    this.resultTitleImage
      ?.setPosition(resultTitleX, resultTitleY)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(
      this.resultTitleImage,
      panelWidth * (isDesktopResult ? Phaser.Math.Clamp(0.47 + this.layoutTuning.resultTitleS * 0.012, 0.3, 0.68) : 0.82),
      panelHeight * (isDesktopResult ? Phaser.Math.Clamp(0.28 + this.layoutTuning.resultTitleS * 0.008, 0.18, 0.4) : 0.16)
    );

    this.resultSongPlateImage
      ?.setPosition(leftColumnX, songY)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(this.resultSongPlateImage, leftColumnWidth * songScale, panelHeight * (isDesktopResult ? 0.2 * songScale : 0.105));

    const difficultyAssetKey = this.getResultDifficultyAssetKey();
    this.resultDifficultyImage?.setTexture(difficultyAssetKey);
    this.resultDifficultyImage
      ?.setPosition(difficultyX, difficultyY)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(
      this.resultDifficultyImage,
      panelWidth * (isDesktopResult ? 0.08 * difficultyScale : 0.18),
      panelHeight * (isDesktopResult ? 0.2 * difficultyScale : 0.112)
    );

    this.resultScoreFrameImage
      ?.setPosition(scoreX, scoreY - panelHeight * (isDesktopResult ? 0.02 : 0.012))
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(this.resultScoreFrameImage, scoreWidth, panelHeight * (isDesktopResult ? Phaser.Math.Clamp(0.5 + this.layoutTuning.resultScoreH * 0.012, 0.34, 0.66) : 0.18));

    this.resultStatsPanelImage
      ?.setPosition(panelX, statsY)
      .setAlpha(0)
      .setVisible(false);
    this.fitImageInBox(this.resultStatsPanelImage, contentWidth, panelHeight * 0.32);

    this.resultDotDividerImage
      ?.setPosition(dividerX, dividerY)
      .setAlpha(isVisible ? 1 : 0)
      .setVisible(isVisible);
    this.fitImageInBox(this.resultDotDividerImage, dividerWidth, panelHeight * 0.04);

    this.startLabel
      ?.setPosition(width / 2, titleY)
      .setFontSize(Math.round(Phaser.Math.Clamp(31 * screenScale, 26, 42)))
      .setColor(this.currentTheme.colors.accent)
      .setStroke(this.currentTheme.colors.line, Math.round(7 * screenScale))
      .setText("RESULT")
      .setAlpha(0);

    this.resultPanelImage
      ?.setPosition(width / 2, panelY)
      .setAlpha(0)
      .setVisible(false);

    if (!isVisible) {
      if (!this.gameEnded) {
        this.resultLabel?.setAlpha(0);
        this.resultSongLabel?.setAlpha(0);
        this.resultScoreLabel?.setAlpha(0);
        this.resultStatsLabel?.setAlpha(0);
        this.resultBackgroundGraphics?.clear();
        [
          this.resultOuterPanelImage,
          this.resultLogoImage,
          this.resultSongPlateImage,
          this.resultDifficultyImage,
          this.resultScoreFrameImage,
          this.resultStatsPanelImage,
          this.resultDotDividerImage
        ].forEach((image) => image?.setAlpha(0).setVisible(false));
        this.resultStatParts.forEach((part) => {
          part.image?.setAlpha(0).setVisible(false);
          part.label.setAlpha(0);
        });
      }
      return;
    }

    this.resultLabel
      ?.setPosition(width / 2, panelY - panelHeight * 0.3)
      .setFontSize(Math.round(Phaser.Math.Clamp(18 * screenScale, 15, 24)))
      .setColor(this.currentTheme.colors.text)
      .setStroke(this.currentTheme.colors.line, Math.round(4 * screenScale))
      .setAlpha(0)
      .setDepth(330);

    this.resultSongLabel
      ?.setPosition(leftColumnX - leftColumnWidth * songScale * (isDesktopResult ? 0.18 : 0.25), songY)
      .setOrigin(0, 0.5)
      .setFontSize(Math.round(Phaser.Math.Clamp((isDesktopResult ? 21 * songScale : 18) * screenScale, isDesktopResult ? 16 : 15, isDesktopResult ? 36 : 26)))
      .setColor("#5A3824")
      .setStroke("#fff7dc", Math.round(2 * screenScale))
      .setAlpha(isVisible ? 1 : 0)
      .setDepth(330)
      .setText(this.selectedSong.shortTitle);

    this.resultScoreLabel
      ?.setPosition(panelX, scoreY + panelHeight * 0.032)
      .setFontSize(Math.round(Phaser.Math.Clamp(46 * screenScale, 38, 64)))
      .setColor("#5A3824")
      .setStroke("#fff7dc", Math.round(6 * screenScale))
      .setText(this.score.toString().padStart(5, "0"))
      .setAlpha(0)
      .setDepth(331);

    this.resultStatsLabel
      ?.setPosition(width / 2, panelY + panelHeight * 0.26)
      .setFontSize(Math.round(Phaser.Math.Clamp(17 * screenScale, 14, 24)))
      .setColor(this.currentTheme.colors.text)
      .setStroke(this.currentTheme.colors.line, Math.round(4 * screenScale))
      .setLineSpacing(Math.round(9 * screenScale))
      .setAlpha(0)
      .setDepth(330);

    this.resultStatParts.forEach((part) => {
      const statOrder: ResultStatKind[] = ["maxCombo", "perfect", "good", "nice", "miss"];
      const rowIndex = statOrder.indexOf(part.kind);
      const isScore = part.kind === "score";
      const rowGap = panelHeight * (isDesktopResult ? Phaser.Math.Clamp(0.122 + this.layoutTuning.resultStatGap * 0.006, 0.08, 0.18) : 0.068);
      const rowY = statsY - panelHeight * (isDesktopResult ? 0.225 : 0.105) + rowIndex * rowGap;
      const x = isScore ? scoreX : rightColumnX;
      const y = isScore ? scoreY : rowY;
      const statScale = isDesktopResult ? Phaser.Math.Clamp(1 + this.layoutTuning.resultStatS * 0.012, 0.72, 1.34) : 1;
      const cardWidth = isScore ? 0 : rightColumnWidth * statScale;
      const cardHeight = isScore ? 0 : panelHeight * (isDesktopResult ? Phaser.Math.Clamp(0.175 + this.layoutTuning.resultStatH * 0.006, 0.1, 0.24) : 0.076) * statScale;
      const labelY = isScore ? scoreY - panelHeight * 0.006 : y;
      const labelX = isScore ? scoreX : rightColumnX + rightColumnWidth * 0.28;
      const scoreNumberScale = isDesktopResult ? Phaser.Math.Clamp(1 + this.layoutTuning.resultScoreS * 0.018, 0.72, 1.42) : 1;
      const statNumberScale = isDesktopResult ? statScale : 1;
      const fontSize = Math.round(
        Phaser.Math.Clamp((isScore ? 46 * scoreNumberScale : isDesktopResult ? 20 * statNumberScale : 24) * screenScale, isScore ? 32 : 18, isScore ? 78 : isDesktopResult ? 36 : 31)
      );

      part.image
        ?.setPosition(x, y)
        .setAlpha(isVisible && !isScore ? 1 : 0)
        .setVisible(isVisible && !isScore);
      if (!isScore) {
        this.fitImageInBox(part.image, cardWidth, cardHeight);
      }
      part.label
        .setPosition(labelX, labelY)
        .setOrigin(0.5)
        .setFontSize(fontSize)
        .setColor(isScore ? "#5A3824" : this.getResultStatColor(part.kind))
        .setStroke("#fff8df", Math.max(2, Math.round(3 * screenScale)))
        .setText(this.getResultStatText(part.kind))
        .setAlpha(isVisible ? 1 : 0)
        .setDepth(327);
    });
  }

  private getResultDifficultyAssetKey() {
    if (this.selectedDifficulty === "easy") {
      return "tinytoy_ui_part_result_minimal_difficulty_easy_01";
    }

    if (this.selectedDifficulty === "hard") {
      return "tinytoy_ui_part_result_minimal_difficulty_hard_01";
    }

    return "tinytoy_ui_part_result_minimal_difficulty_normal_01";
  }

  private layoutSettingsPage() {
    const { width, height } = this.scale;
    const screenScale = Math.max(this.screenScale, 0.9);
    const isVisible = !this.gameStarted && !this.gameEnded && this.menuStep === "settings";
    const panelWidth = Math.min(width * (this.isPortrait ? 0.78 : 0.42), 430 * screenScale);
    const panelHeight = Math.min(height * (this.isPortrait ? 0.34 : 0.36), 260 * screenScale);
    const panelY = height * (this.isPortrait ? 0.48 : 0.5);
    const rowGap = panelHeight * 0.36;
    const rowY = [panelY - rowGap * 0.45, panelY + rowGap * 0.45];
    const labelSize = Math.round(Phaser.Math.Clamp(25 * screenScale, 22, 34));
    const sliderWidth = Math.min(panelWidth * 0.78, 310 * screenScale);
    const sliderHeight = Math.round(Phaser.Math.Clamp(18 * screenScale, 15, 22));
    const knobSize = Math.round(Phaser.Math.Clamp(44 * screenScale, 38, 56));

    this.settingsPanelImage
      ?.setPosition(width / 2, panelY)
      .setAlpha(0)
      .setVisible(false);
    this.fitImageInBox(this.settingsPanelImage, panelWidth, panelHeight);

    this.settingsTitleLabel
      ?.setAlpha(0);
    this.settingsBgmLabel?.setAlpha(0);
    this.settingsSeLabel?.setAlpha(0);

    this.layoutAudioSettingRow("bgm", rowY[0], sliderWidth, sliderHeight, knobSize, labelSize, isVisible);
    this.layoutAudioSettingRow("se", rowY[1], sliderWidth, sliderHeight, knobSize, labelSize, isVisible);
  }

  private layoutAudioSettingRow(kind: AudioSettingKind, y: number, sliderWidth: number, sliderHeight: number, knobSize: number, labelSize: number, isVisible: boolean) {
    const { width } = this.scale;
    const volume = kind === "bgm" ? this.audioSettings.bgmVolume : this.audioSettings.seVolume;
    const enabled = kind === "bgm" ? this.audioSettings.bgmEnabled : this.audioSettings.seEnabled;
    const slider = this.audioSettingSliders.find((candidate) => candidate.kind === kind);
    const percent = Math.round(volume * 100);
    const trackX = width / 2;
    const trackLeft = trackX - sliderWidth / 2;
    const knobX = trackLeft + sliderWidth * volume;
    const fillWidth = Math.max(sliderHeight, sliderWidth * volume);
    const labelColor = kind === "bgm" ? "#2FAF9C" : "#E95882";
    const labelY = y - 46 * this.screenScale;

    slider?.label
      .setPosition(trackLeft, labelY)
      .setOrigin(0, 0.5)
      .setFontSize(labelSize)
      .setColor(enabled ? labelColor : this.currentTheme.colors.primary)
      .setStroke("#ffffff", Math.max(4, Math.round(6 * this.screenScale)))
      .setText(kind.toUpperCase())
      .setAlpha(isVisible ? 1 : 0);

    slider?.valueLabel
      .setPosition(trackLeft + sliderWidth, labelY)
      .setFontSize(Math.round(Phaser.Math.Clamp(18 * this.screenScale, 15, 24)))
      .setColor(enabled ? labelColor : this.currentTheme.colors.primary)
      .setStroke("#ffffff", Math.max(3, Math.round(4 * this.screenScale)))
      .setText(`${percent}%`)
      .setAlpha(isVisible ? 1 : 0);

    if (!slider) {
      return;
    }

    const fillColor = kind === "bgm" ? 0x62d9c5 : 0xff7a9a;
    this.drawStickerSliderTrack(slider.track, trackX, y, sliderWidth, sliderHeight, 0xfff3d8, isVisible ? 1 : 0);
    this.drawStickerSliderFill(slider.fill, trackLeft, y, fillWidth, sliderHeight, fillColor, isVisible ? (enabled ? 1 : 0.46) : 0);
    this.drawStickerSliderKnob(slider.knob, knobX, y, knobSize, fillColor, isVisible ? 1 : 0);
    slider.trackHit
      .setPosition(trackX, y)
      .setSize(sliderWidth, knobSize * 1.35)
      .setAlpha(0);
    slider.knobHit
      .setPosition(knobX, y)
      .setSize(knobSize * 1.25, knobSize * 1.25)
      .setAlpha(0);
  }

  private drawStickerSliderTrack(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, color: number, alpha: number) {
    const radius = height / 2;
    graphics.clear();
    if (alpha <= 0) {
      return;
    }

    graphics.fillStyle(this.themeColor("shadow"), 0.18 * alpha);
    graphics.fillRoundedRect(x - width / 2 + 4 * this.screenScale, y - height / 2 + 5 * this.screenScale, width, height, radius);
    graphics.fillStyle(0xffffff, alpha);
    graphics.fillRoundedRect(x - width / 2 - 4 * this.screenScale, y - height / 2 - 4 * this.screenScale, width + 8 * this.screenScale, height + 8 * this.screenScale, radius + 4 * this.screenScale);
    graphics.fillStyle(color, 0.96 * alpha);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    graphics.lineStyle(2 * this.screenScale, this.themeColor("line"), 0.58 * alpha);
    graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  }

  private drawStickerSliderFill(graphics: Phaser.GameObjects.Graphics, left: number, y: number, width: number, height: number, color: number, alpha: number) {
    const radius = height / 2;
    graphics.clear();
    if (alpha <= 0) {
      return;
    }

    graphics.fillStyle(color, 0.94 * alpha);
    graphics.fillRoundedRect(left, y - height / 2, width, height, radius);
    graphics.lineStyle(1.5 * this.screenScale, 0xffffff, 0.66 * alpha);
    graphics.strokeRoundedRect(left + 1 * this.screenScale, y - height / 2 + 1 * this.screenScale, Math.max(1, width - 2 * this.screenScale), height - 2 * this.screenScale, radius);
  }

  private drawStickerSliderKnob(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number, alpha: number) {
    graphics.clear();
    if (alpha <= 0) {
      return;
    }

    graphics.fillStyle(this.themeColor("shadow"), 0.2 * alpha);
    graphics.fillCircle(x + 4 * this.screenScale, y + 5 * this.screenScale, size * 0.5);
    graphics.fillStyle(0xffffff, alpha);
    graphics.fillCircle(x, y, size * 0.58);
    graphics.lineStyle(3 * this.screenScale, color, 0.72 * alpha);
    graphics.strokeCircle(x, y, size * 0.5);
    graphics.fillStyle(0xffffff, alpha);
    graphics.fillCircle(x, y, size * 0.43);
    graphics.fillStyle(0xffffff, 0.5 * alpha);
    graphics.fillCircle(x - size * 0.14, y - size * 0.16, size * 0.12);
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
    const hudAssetScale = 1.12;
    const scoreWidth = 156 * scale * hudAssetScale;
    const scoreHeight = 104 * scale * hudAssetScale;
    const comboWidth = 152 * scale * hudAssetScale;
    const comboHeight = 104 * scale * hudAssetScale;
    const missWidth = 140 * scale * hudAssetScale;
    const missHeight = 104 * scale * hudAssetScale;

    this.comboBadgeImage
      ?.setPosition(12 * scale + comboWidth / 2, 120 * scale + comboHeight / 2)
      .setDepth(299.8)
      .setAlpha(isHudVisible ? 1 : 0)
      .setVisible(isHudVisible);
    this.fitImageInBox(this.comboBadgeImage, comboWidth, comboHeight);

    this.scoreStickerImage
      ?.setPosition(8 * scale + scoreWidth / 2, 6 * scale + scoreHeight / 2)
      .setDepth(299.5)
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
      .setAlpha(0)
      .setVisible(false);
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
    const isDesktopLandscape = this.isDesktopLandscape;
    const titleWidth = isDesktopLandscape ? Math.min(width * 0.43, 330) : Math.min(width * 0.75, 470 * Math.max(screenScale, 0.9));
    const titleHeight = titleWidth * 0.6;
    const titleLayoutHeight = titleWidth * (isDesktopLandscape ? 0.28 : 0.36);
    const titleY = height * (this.isPortrait ? 0.24 : isDesktopLandscape ? 0.16 : 0.17);
    const totalWidth = isDesktopLandscape ? Math.min(width * 0.46, 340) : Math.min(width * 0.9, 390 * Math.max(screenScale, 0.9));
    const gap = (isDesktopLandscape ? 8 : 10) * screenScale;
    const buttonWidth = (totalWidth - gap * 2) / 3;
    const buttonHeight = (isDesktopLandscape ? 82 : 104) * Math.max(screenScale, 0.9);
    const desiredCenterY = height * (this.isPortrait ? 0.52 : isDesktopLandscape ? 0.55 : 0.49);
    const minCenterY = titleY + titleLayoutHeight * 0.5 + buttonHeight * (isDesktopLandscape ? 1.06 : 1.15);
    const maxCenterY = height - buttonHeight * (isDesktopLandscape ? 2.55 : 2.3);
    const centerY = Phaser.Math.Clamp(desiredCenterY, minCenterY, maxCenterY);
    const isSelectable = !this.gameStarted && !this.gameEnded && this.menuStep === "difficulty";

    this.difficultyTitleImage
      ?.setPosition(width / 2, titleY)
      .setAlpha(isSelectable ? 0.98 : 0)
      .setVisible(isSelectable);
    this.fitImageInBox(this.difficultyTitleImage, titleWidth, titleHeight);

    const startX = width / 2 - totalWidth / 2 + buttonWidth / 2;

    this.difficultyButtons.forEach((button, index) => {
      const selected = button.id === this.selectedDifficulty;
      const x = startX + index * (buttonWidth + gap);
      const fillColor = selected ? this.themeColor("accent") : this.themeColor("trackAlt");
      const strokeColor = selected ? this.themeColor("line") : this.themeColor("primary");
      const alpha = isSelectable ? 1 : 0;

      button.background
        .setPosition(x, centerY)
        .setSize(buttonWidth, buttonHeight)
        .setFillStyle(fillColor, button.assetImage ? 0 : selected ? 1 : 0.92)
        .setStrokeStyle(2 * screenScale, strokeColor, button.assetImage ? 0 : selected ? 0.95 : 0.65)
        .setAlpha(alpha);

      button.assetImage
        ?.setPosition(x, centerY)
        .setAlpha(isSelectable && !selected ? 0.92 : 0)
        .setVisible(alpha > 0);
      button.assetImage?.setTint(0xffffff);
      this.fitImageInBox(button.assetImage, buttonWidth * 1.35, buttonHeight * 2.05);
      button.selectedAssetImage
        ?.setPosition(x, centerY)
        .setAlpha(isSelectable && selected ? 1 : 0)
        .setVisible(alpha > 0);
      button.selectedAssetImage?.setTint(0xffffff);
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
    const isDesktopLandscape = this.isDesktopLandscape;
    const isSelectable = !this.gameStarted && !this.gameEnded && this.menuStep === "song";
    const isTitleVisible = !this.gameStarted && !this.gameEnded && this.menuStep === "song";
    const centerX = width / 2;
    const titleWidth = isDesktopLandscape ? Math.min(width * 0.43, 330) : Math.min(width * 0.75, 470 * Math.max(screenScale, 0.9));
    const titleHeight = titleWidth * 0.6;
    const titleLayoutHeight = titleWidth * (isDesktopLandscape ? 0.28 : 0.36);
    const titleY = height * (this.isPortrait ? 0.18 : isDesktopLandscape ? 0.12 : 0.16);
    const titleDisplayY = isDesktopLandscape ? height * 0.15 : titleY;
    const cardWidth = this.isPortrait ? Math.min(width * 0.56, 250) : isDesktopLandscape ? Math.min(width * 0.215, 198) : Math.min(width * 0.26, 270);
    const cardHeight = cardWidth * (806 / 450);
    const sideWidth = cardWidth * 0.58;
    const sideHeight = sideWidth * (806 / 450);
    const desiredCardY = height * (this.isPortrait ? 0.53 : isDesktopLandscape ? 0.51 : 0.53);
    const minCardY = titleY + titleLayoutHeight * 0.5 + cardHeight * 0.52 + (isDesktopLandscape ? 6 : 18) * screenScale;
    const maxCardY = height - cardHeight * 0.58 - (isDesktopLandscape ? 72 : 58) * screenScale;
    const cardY = Phaser.Math.Clamp(desiredCardY, minCardY, maxCardY);
    const sideOffsetX = isDesktopLandscape ? cardWidth * 0.58 : Math.min(width * 0.28, cardWidth * 0.72);
    const sideY = cardY + cardHeight * 0.02;
    const arrowSize = Math.round(Phaser.Math.Clamp((isDesktopLandscape ? 72 : 72) * Math.max(screenScale, 0.86), isDesktopLandscape ? 62 : 62, isDesktopLandscape ? 82 : 86));
    const arrowY = cardY;
    const arrowOffsetX = isDesktopLandscape ? cardWidth * 1.08 : Math.min(width * 0.43, cardWidth * 0.98);
    const currentIndex = this.selectedSongIndex;
    const previousIndex = (currentIndex - 1 + SONGS.length) % SONGS.length;
    const nextIndex = (currentIndex + 1) % SONGS.length;

    this.songSelectTitleImage
      ?.setPosition(centerX, titleDisplayY)
      .setAlpha(isTitleVisible ? 0.98 : 0)
      .setVisible(isTitleVisible);
    this.fitImageInBox(this.songSelectTitleImage, titleWidth, titleHeight);

    this.drawSongSelectPagination(centerX, cardY + cardHeight * 0.53, isSelectable);

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
      const textColor = "#6B4326";
      const titleText = this.getSongCardTitle(button.song.title, selected);
      const indexText = String(index + 1).padStart(2, "0");
      const titleSize = Math.round(Phaser.Math.Clamp((selected ? 19 : 12) * Math.max(screenScale, 0.9), selected ? 17 : 10, selected ? 24 : 15));
      const indexSize = Math.round(Phaser.Math.Clamp((selected ? 22 : 13) * Math.max(screenScale, 0.9), selected ? 18 : 11, selected ? 30 : 16));
      const metaSize = Math.round(Phaser.Math.Clamp((selected ? 13 : 9) * Math.max(screenScale, 0.9), selected ? 11 : 8, selected ? 18 : 12));
      const titleY = y + buttonHeight * (selected ? 0.245 : 0.24);
      const baseDepth = selected ? 332 : 314;

      button.background.setDepth(baseDepth);
      button.thumbnail.setDepth(baseDepth + 1);
      button.thumbnailAccent.setDepth(baseDepth + 1.1);
      button.thumbnailImage?.setDepth(baseDepth + 1.2);
      button.assetImage?.setDepth(baseDepth + 2);
      button.sideAssetImage?.setDepth(baseDepth + 2);
      button.indexLabel.setDepth(baseDepth + 3);
      button.label.setDepth(baseDepth + 3);
      button.metaLabel.setDepth(baseDepth + 3);
      button.starLabel.setDepth(baseDepth + 3);

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

      const cardAsset = selected ? button.assetImage : button.sideAssetImage;
      const cardVisualWidth = cardAsset?.displayWidth || buttonWidth;
      const cardVisualHeight = cardAsset?.displayHeight || buttonHeight;
      const thumbnailWidth = cardVisualWidth * 0.743;
      const thumbnailHeight = cardVisualHeight * 0.606;
      const thumbnailY = y - cardVisualHeight * 0.101;

      button.thumbnailMaskGraphics
        .clear()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(
          x - thumbnailWidth * 0.5,
          thumbnailY - thumbnailHeight * 0.5,
          thumbnailWidth,
          thumbnailHeight,
          12 * Math.max(screenScale, 0.85)
        );

      button.thumbnail
        .setOrigin(0.5)
        .setPosition(x, thumbnailY)
        .setSize(thumbnailWidth, thumbnailHeight)
        .setFillStyle(toColorNumber(buttonTheme.colors.primary), selected ? 0.86 : 0.58)
        .setAlpha(isVisible && !button.thumbnailImage ? 1 : 0);

      button.thumbnailAccent
        .setOrigin(0.5)
        .setPosition(x, thumbnailY)
        .setSize(thumbnailWidth, thumbnailHeight)
        .setFillStyle(toColorNumber(buttonTheme.colors.accent), selected ? 0.92 : 0.55)
        .setAlpha(isVisible && button.thumbnailImage ? 0.08 : isVisible ? 0.18 : 0);

      button.thumbnailImage
        ?.setOrigin(0.5)
        .setPosition(x, thumbnailY)
        .setAlpha(isVisible ? 1 : 0)
        .setVisible(isVisible);
      this.coverImageInBox(button.thumbnailImage, thumbnailWidth, thumbnailHeight);

      button.indexLabel
        .setPosition(x - buttonWidth * (selected ? 0.39 : 0.34), y - buttonHeight * (selected ? 0.4 : 0.34))
        .setFontSize(indexSize)
        .setText(indexText)
        .setColor(buttonTheme.colors.primary)
        .setAlpha(0);

      button.label
        .setPosition(x, titleY)
        .setOrigin(0.5)
        .setFontSize(titleSize)
        .setText(titleText)
        .setColor(textColor)
        .setStroke("#fffaf0", selected ? 2 : 1)
        .setAlign("center")
        .setLineSpacing(-6 * Math.max(screenScale, 0.9))
        .setAlpha(isVisible ? 1 : 0);

      button.metaLabel
        .setPosition(x - buttonWidth * (selected ? 0.36 : 0.32), y + buttonHeight * (selected ? 0.31 : 0.31))
        .setFontSize(metaSize)
        .setText("")
        .setColor(textColor)
        .setAlpha(0);

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
    if (words.length <= 3) {
      return title;
    }

    return `${words.slice(0, 2).join(" ")}\n${words.slice(2).join(" ")}`;
  }

  private getSongCardStars(index: number) {
    const filledStars = Phaser.Math.Clamp(3 + (index % 2), 3, 4);
    return Array.from({ length: 5 }, (_, starIndex) => (starIndex < filledStars ? "★" : "☆")).join(" ");
  }

  private drawSongSelectPagination(x: number, y: number, isVisible: boolean) {
    const graphics = this.songSelectPaginationGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    graphics.setPosition(x, y);
    graphics.setAlpha(isVisible ? 1 : 0);
    graphics.setVisible(isVisible);
    if (!isVisible) {
      return;
    }

    const scale = Math.max(this.screenScale, 0.85);
    const dotCount = SONGS.length;
    const gap = 17 * scale;
    const radius = 5.2 * scale;
    const activeRadius = 6.4 * scale;
    const startX = -((dotCount - 1) * gap) / 2;

    for (let index = 0; index < dotCount; index += 1) {
      const dotX = startX + index * gap;
      const isActive = index === this.selectedSongIndex;
      const size = isActive ? activeRadius : radius;

      graphics.fillStyle(isActive ? 0x7fd7ff : 0xffffff, 1);
      graphics.fillCircle(dotX, 0, size);
      graphics.lineStyle(1.6 * scale, isActive ? 0x6bcb77 : 0xfff3d8, 1);
      graphics.strokeCircle(dotX, 0, size);
    }
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

    graphics.fillStyle(isSongMenu ? 0xf7dfac : this.themeColor("track"), isSongMenu ? 0.38 : 1);
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
    const track = this.getTrackLayout();
    const laneResponsiveScale = this.getLaneResponsiveScale(track);
    const buttonScale = Phaser.Math.Clamp(laneResponsiveScale * (this.isPortrait ? 1.04 : 0.78), 0.48, this.isPortrait ? 1.04 : 0.78);
    const portraitButtonSizeScale = this.isPortrait && this.gameStarted ? this.portraitButtonScale : 1;
    const portraitButtonSize = Phaser.Math.Clamp(width * 0.27 * portraitButtonSizeScale, 92 * screenScale, 126 * screenScale);
    const buttonSize =
      this.isPortrait && this.gameStarted
        ? portraitButtonSize
        : Phaser.Math.Clamp(width * 0.38 * buttonScale * portraitButtonSizeScale, 76 * screenScale, 210 * screenScale);
    const runnerScreenScale = Math.max(screenScale, this.isPortrait ? RUNNER_MIN_SCREEN_SCALE : screenScale);
    const playerScale =
      Phaser.Math.Linear(0.45, 1.16, GAME_BALANCE.playerZ) *
      runnerScreenScale *
      laneResponsiveScale *
      (this.isPortrait && this.gameStarted ? this.portraitCharacterScale : 1);
    const runnerBottomOffset = (RUNNER_DISPLAY_HEIGHT * playerScale) / 2;
    const maxButtonY = height - buttonSize * 0.52;
    const isVisible = this.gameStarted && !this.isDesktopLandscape;

    this.jumpButtons.forEach((button, index) => {
      const playerPoint = this.getPlayerLaneCenterPoint(track, index);
      const x = playerPoint.x;
      const portraitButtonLift = this.isPortrait ? 14 * screenScale : 0;
      const portraitButtonY = this.isPortrait && this.gameStarted ? this.layoutTuning.buttonY * 4 * screenScale : 0;
      const centerY = Math.min(playerPoint.y + runnerBottomOffset + buttonSize * 0.5 + 8 * screenScale - portraitButtonLift + portraitButtonY, maxButtonY);

      button.background
        .setPosition(x, centerY)
        .setSize(buttonSize, buttonSize)
        .setFillStyle(this.themeColor("trackAlt"), 0.01)
        .setStrokeStyle(0, this.runnerColor(index), 0)
        .setAlpha(isVisible ? 0.01 : 0);
      button.assetImage
        ?.setPosition(x, centerY)
        .setAlpha(0)
        .setVisible(false);
      this.fitImageInBox(button.assetImage, buttonSize, buttonSize);
      button.pressedAssetImage
        ?.setPosition(x, centerY)
        .setAlpha(0)
        .setVisible(false);
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
        (this.menuStep === "start" && button.action === "play") ||
        (this.menuStep === "song" && button.action === "setting") ||
        (this.menuStep === "difficulty" && (button.action === "play" || button.action === "back" || button.action === "setting")) ||
        (this.menuStep === "settings" && button.action === "back") ||
        (this.menuStep === "ranking" && (button.action === "home" || button.action === "retry")) ||
        (this.menuStep === "result" && (button.action === "home" || button.action === "retry" || button.action === "setting"));

      return isActive && button.background.getBounds().contains(x, y);
    });
    if (!targetButton) {
      return false;
    }

    if (this.menuStep === "start" && targetButton.action === "play") {
      if (!this.htmlStartConfirmed) {
        return true;
      }

      this.runAfterPressedAssetFeedback(targetButton, () => this.showSongSelect());
      return true;
    }

    if (this.menuStep === "difficulty" && targetButton.action === "play") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.startRun());
      return true;
    }

    if (this.menuStep === "difficulty" && targetButton.action === "setting") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showSettingsScreen("difficulty"));
      return true;
    }

    if (this.menuStep === "song" && targetButton.action === "setting") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showSettingsScreen("song"));
      return true;
    }

    if (this.menuStep === "result" && targetButton.action === "setting") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showSettingsScreen("result"));
      return true;
    }

    if (this.menuStep === "settings" && targetButton.action === "back") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.closeSettingsScreen());
      return true;
    }

    if (this.menuStep === "difficulty" && targetButton.action === "back") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showSongSelect());
      return true;
    }

    if (this.menuStep === "ranking" && targetButton.action === "home") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showStartScreen());
      return true;
    }

    if (this.menuStep === "ranking" && targetButton.action === "retry") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.startRun());
      return true;
    }

    if (this.menuStep === "result" && targetButton.action === "home") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.showStartScreen());
      return true;
    }

    if (this.menuStep === "result" && targetButton.action === "retry") {
      this.runAfterPressedAssetFeedback(targetButton, () => this.startRun());
      return true;
    }

    return false;
  }

  private trySelectDifficulty(x: number, y: number) {
    const targetButton = this.difficultyButtons.find((button) => button.background.alpha > 0 && button.background.getBounds().contains(x, y));
    if (!targetButton) {
      return false;
    }

    this.playUiSe();
    this.selectDifficulty(targetButton.id);
    return true;
  }

  private tryPressAudioSettingSlider(x: number, y: number) {
    const targetSlider = this.audioSettingSliders.find((slider) => {
      if (slider.label.alpha <= 0) {
        return false;
      }

      const trackBounds = slider.trackHit.getBounds();
      const knobBounds = slider.knobHit.getBounds();
      const paddedTrack = new Phaser.Geom.Rectangle(trackBounds.x - 12 * this.screenScale, trackBounds.y - 18 * this.screenScale, trackBounds.width + 24 * this.screenScale, trackBounds.height + 36 * this.screenScale);
      return knobBounds.contains(x, y) || paddedTrack.contains(x, y);
    });
    if (!targetSlider) {
      return false;
    }

    this.playUiSe();
    this.activeAudioSlider = targetSlider.kind;
    this.setAudioSettingFromPointer(targetSlider.kind, x, true);
    return true;
  }

  private setAudioSettingFromPointer(kind: AudioSettingKind, x: number, shouldAnimate: boolean) {
    const targetSlider = this.audioSettingSliders.find((slider) => slider.kind === kind);
    if (!targetSlider) {
      return;
    }

    const trackBounds = targetSlider.trackHit.getBounds();
    const nextVolume = Phaser.Math.Clamp((x - trackBounds.left) / Math.max(trackBounds.width, 1), 0, 1);
    this.setAudioSettingVolume(kind, nextVolume, shouldAnimate);
  }

  private setAudioSettingVolume(kind: AudioSettingKind, volume: number, shouldAnimate: boolean) {
    const isBgm = kind === "bgm";
    const key = isBgm ? "bgmVolume" : "seVolume";
    const enabledKey = isBgm ? "bgmEnabled" : "seEnabled";
    const nextVolume = Number(Phaser.Math.Clamp(volume, 0, 1).toFixed(2));

    this.audioSettings = {
      ...this.audioSettings,
      [key]: nextVolume,
      [enabledKey]: nextVolume > 0
    };
    this.applyAudioSettings(true);
    this.layout();
    if (shouldAnimate) {
      this.animateAudioSettingChange(kind);
    }
  }

  private animateAudioSettingChange(kind: AudioSettingKind) {
    if (this.menuStep !== "settings") {
      return;
    }

    const slider = this.audioSettingSliders.find((candidate) => candidate.kind === kind);
    if (!slider) {
      return;
    }

    const targets = [slider.label, slider.valueLabel, slider.knob].filter(
      (target): target is Phaser.GameObjects.Text | Phaser.GameObjects.Graphics => Boolean(target && target.alpha > 0)
    );

    this.tweens.killTweensOf(targets);
    targets.forEach((target) => {
      const finalScaleX = target.scaleX;
      const finalScaleY = target.scaleY;
      target.setScale(finalScaleX * 1.08, finalScaleY * 1.08);
      this.tweens.add({
        targets: target,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        duration: 170,
        ease: "Back.Out"
      });
    });
  }

  private selectDifficulty(difficulty: DifficultyId) {
    this.selectedDifficulty = difficulty;
    this.loadChart();
    this.layout();
    this.animateDifficultySelection(difficulty);
  }

  private animateDifficultySelection(difficulty: DifficultyId) {
    if (this.menuStep !== "difficulty") {
      return;
    }

    const selectedButton = this.difficultyButtons.find((button) => button.id === difficulty);
    if (!selectedButton || selectedButton.background.alpha <= 0) {
      return;
    }

    const targets = [selectedButton.background, selectedButton.assetImage, selectedButton.selectedAssetImage].filter(
      (target): target is Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image => Boolean(target && target.alpha > 0)
    );
    if (targets.length === 0) {
      return;
    }

    this.tweens.killTweensOf(targets);
    targets.forEach((target) => {
      const finalScaleX = target.scaleX;
      const finalScaleY = target.scaleY;
      target.setScale(finalScaleX * 0.94, finalScaleY * 0.94);
      this.tweens.add({
        targets: target,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        duration: 210,
        ease: "Back.Out"
      });
    });
  }

  private runAfterPressedAssetFeedback(
    button: { background: Phaser.GameObjects.Rectangle; assetImage?: Phaser.GameObjects.Image; pressedAssetImage?: Phaser.GameObjects.Image },
    action: () => void
  ) {
    this.playUiSe();
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
    if (normalAlpha <= 0 || !button.assetImage.visible) {
      return false;
    }

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

    const selectedButton = this.songButtons[this.selectedSongIndex];
    if (selectedButton?.background.getBounds().contains(x, y)) {
      this.playUiSe();
      this.selectSong(this.selectedSongIndex);
      return true;
    }

    const targetIndex = this.songButtons.findIndex((button, index) => {
      if (index === this.selectedSongIndex || button.background.alpha <= 0) {
        return false;
      }

      return button.background.getBounds().contains(x, y);
    });
    if (targetIndex < 0) {
      return false;
    }

    this.playUiSe();
    this.browseSong(targetIndex);
    return true;
  }

  private browseSongByOffset(offset: number) {
    this.browseSong((this.selectedSongIndex + offset + SONGS.length) % SONGS.length, offset);
  }

  private browseSong(index: number, direction = 0) {
    const changedSong = this.selectedSongIndex !== index;
    const inferredDirection = index > this.selectedSongIndex ? 1 : -1;

    this.selectedSongIndex = index;
    if (changedSong) {
      this.createSelectedBgm();
      this.loadChart();
    }
    this.layout();
    if (changedSong) {
      this.animateSongCards(direction || inferredDirection);
    }
  }

  private selectSong(index: number) {
    const changedSong = this.selectedSongIndex !== index;

    this.selectedSongIndex = index;
    if (changedSong) {
      this.createSelectedBgm();
      this.loadChart();
    }
    this.showDifficultySelect();
    this.layout();
    this.animateDifficultyScreenIn();
  }

  private animateSongCards(direction: number) {
    if (this.menuStep !== "song") {
      return;
    }

    const turnDirection = Phaser.Math.Clamp(direction, -1, 1) || 1;
    const { width } = this.scale;
    const travel = Math.min(width * 0.28, 138 * Math.max(this.screenScale, 0.9)) * turnDirection;
    const selectedIndex = this.selectedSongIndex;
    const previousSelectedIndex = (selectedIndex - turnDirection + SONGS.length) % SONGS.length;
    type SongCardTweenTarget =
      | Phaser.GameObjects.Rectangle
      | Phaser.GameObjects.Image
      | Phaser.GameObjects.Text
      | Phaser.GameObjects.Graphics;

    this.songButtons.forEach((button, index) => {
      const targets = [
        button.background,
        button.thumbnail,
        button.thumbnailAccent,
        button.thumbnailMaskGraphics,
        button.thumbnailImage,
        button.assetImage,
        button.sideAssetImage,
        button.indexLabel,
        button.label,
        button.metaLabel,
        button.starLabel
      ].filter((target): target is SongCardTweenTarget => Boolean(target && target.alpha > 0));

      if (targets.length === 0) {
        return;
      }

      const isSelected = index === selectedIndex;
      const wasSelected = index === previousSelectedIndex;
      const startScale = isSelected ? 0.78 : wasSelected ? 1.12 : 0.88;
      const startAlphaRatio = isSelected ? 0.72 : wasSelected ? 0.96 : 0.42;
      const startAngle = isSelected ? 5 * turnDirection : wasSelected ? -3 * turnDirection : 2 * turnDirection;
      const startY = isSelected ? 12 * this.screenScale : wasSelected ? -6 * this.screenScale : 8 * this.screenScale;

      this.tweens.killTweensOf(targets);
      targets.forEach((target) => {
        const finalAlpha = target.alpha;
        const finalX = target.x;
        const finalY = target.y;
        const finalScaleX = target.scaleX;
        const finalScaleY = target.scaleY;
        const finalAngle = target.angle;
        target.x += travel;
        target.y += startY;
        target.setScale(finalScaleX * startScale, finalScaleY * startScale);
        target.setAngle(finalAngle + startAngle);
        target.setAlpha(finalAlpha * startAlphaRatio);

        this.tweens.add({
          targets: target,
          x: finalX,
          y: finalY,
          scaleX: finalScaleX,
          scaleY: finalScaleY,
          angle: finalAngle,
          alpha: finalAlpha,
          duration: 260,
          ease: "Back.Out"
        });
      });
    });
  }

  private animateSongScreenIn() {
    if (this.menuStep !== "song") {
      return;
    }

    this.animateMenuTargetsIn(this.getSongSelectTargets(), 14 * this.screenScale, 16);
  }

  private getSongSelectTargets() {
    const cardTargets = this.songButtons.flatMap((button) => [
      button.background,
      button.thumbnail,
      button.thumbnailAccent,
      button.thumbnailMaskGraphics,
      button.thumbnailImage,
      button.assetImage,
      button.sideAssetImage,
      button.label,
      button.metaLabel,
      button.indexLabel,
      button.starLabel
    ]);
    const arrowTargets = this.songArrowButtons.flatMap((button) => [button.assetImage, button.pressedAssetImage, button.background]);

    return [this.songSelectTitleImage, this.songSelectPaginationGraphics, ...cardTargets, ...arrowTargets];
  }

  private hideSongSelectTargets() {
    this.getSongSelectTargets()
      .filter((target): target is Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Graphics => Boolean(target))
      .forEach((target) => {
        this.tweens.killTweensOf(target);
        target.setAlpha(0);
      });
  }

  private animateDifficultyScreenIn() {
    if (this.menuStep !== "difficulty") {
      return;
    }

    const buttonTargets = this.difficultyButtons.flatMap((button) => [button.background, button.assetImage, button.selectedAssetImage]);
    this.animateMenuTargetsIn([this.difficultyTitleImage, ...buttonTargets], 12 * this.screenScale, 22);
  }

  private animateSettingsScreenIn() {
    if (this.menuStep !== "settings") {
      return;
    }

    const sliderTargets = this.audioSettingSliders.flatMap((slider) => [slider.track, slider.fill, slider.knob, slider.label, slider.valueLabel]);
    this.animateMenuTargetsIn(sliderTargets, 10 * this.screenScale, 18);
  }

  private animateMenuTargetsIn(
    targets: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Graphics | undefined>,
    shiftY: number,
    delayStep: number
  ) {
    targets
      .filter((target): target is Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Graphics =>
        Boolean(target && target.alpha > 0)
      )
      .forEach((target, index) => {
        const finalY = target.y;
        const finalAlpha = target.alpha;
        const finalScaleX = target.scaleX;
        const finalScaleY = target.scaleY;

        this.tweens.killTweensOf(target);
        target.setY(finalY + shiftY);
        target.setAlpha(0);
        target.setScale(finalScaleX * 0.97, finalScaleY * 0.97);
        this.tweens.add({
          targets: target,
          y: finalY,
          alpha: finalAlpha,
          scaleX: finalScaleX,
          scaleY: finalScaleY,
          duration: 240,
          delay: index * delayStep,
          ease: "Back.Out"
        });
      });
  }

  private showDifficultySelect() {
    this.gameEnded = false;
    this.menuStep = "difficulty";
    this.stopMenuBgm();
    this.hideSongSelectTargets();
    this.hideResultLabels();
    this.startLabel?.setAlpha(1).setScale(1);
  }

  private showStartScreen() {
    this.gameEnded = false;
    this.menuStep = "start";
    this.stopMenuBgm();
    this.resetRunState();
    this.hideResultLabels();
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
  }

  private showRankingScreen() {
    this.gameEnded = false;
    this.menuStep = "ranking";
    this.stopMenuBgm();
    this.hideResultLabels();
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
  }

  private showResultScreen() {
    this.gameEnded = false;
    this.menuStep = "result";
    this.playMenuBgm();
    this.startLabel?.setAlpha(0);
    this.layout();
    this.playResultSe();
    this.popResult();
  }

  private showSettingsScreen(returnStep: SettingsReturnStep) {
    this.gameEnded = false;
    this.settingsReturnStep = returnStep;
    this.menuStep = "settings";
    this.stopMenuBgm();
    this.hideResultLabels();
    this.startLabel?.setAlpha(0);
    this.layout();
    this.animateSettingsScreenIn();
  }

  private closeSettingsScreen() {
    this.menuStep = this.settingsReturnStep;
    if (this.menuStep === "result") {
      this.playMenuBgm();
    } else {
      this.stopMenuBgm();
    }
    this.layout();
  }

  private showSongSelect() {
    this.gameEnded = false;
    this.menuStep = "song";
    this.stopMenuBgm();
    this.resetRunState();
    this.hideResultLabels();
    this.startLabel?.setAlpha(1).setScale(1);
    this.layout();
    this.animateSongScreenIn();
  }

  private hideResultLabels() {
    [this.resultLabel, this.resultSongLabel, this.resultScoreLabel, this.resultStatsLabel].forEach((label) => {
      if (!label) {
        return;
      }

      this.tweens.killTweensOf(label);
      label.setAlpha(0);
    });
    this.resultStatParts.forEach((part) => {
      this.tweens.killTweensOf([part.image, part.label]);
      part.image?.setAlpha(0);
      part.label.setAlpha(0);
    });
  }

  private resetRunState() {
    this.score = 0;
    this.avoidCount = 0;
    this.combo = 0;
    this.comboMilestoneLabel?.setText("").setAlpha(0);
    this.missCount = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.niceCount = 0;
    this.runners.forEach((runner) => {
      runner.isJumping = false;
      runner.container.y = 0;
    });
    this.clearLaneInputHistory();
    this.lastMissEffectAt = 0;
    this.lastLayoutRefreshAt = 0;
    this.setFeverActive(false, true);
    this.updateRunnerSpriteSheets();
    this.clearObstacles();
    this.clearItems();
  }

  private createSelectedBgm() {
    this.bgm?.stop();
    this.bgm?.destroy();
    this.bgm = this.sound.add(this.selectedSong.audioKey, {
      loop: false,
      volume: this.getBgmVolume()
    });
  }

  private createMenuBgm() {
    this.menuBgm?.stop();
    this.menuBgm?.destroy();
    this.menuBgm = this.createSoundIfLoaded(MENU_BGM_AUDIO_KEY, {
      loop: true,
      volume: this.getBgmVolume()
    });
  }

  private playMenuBgm() {
    if (!this.hasAudioGesture || this.gameStarted || this.finishPending || !this.audioSettings.bgmEnabled || !this.menuBgm || this.menuBgm.isPlaying) {
      return;
    }

    this.menuBgm.play();
  }

  private stopMenuBgm() {
    this.menuBgm?.stop();
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

  private get isDesktopLandscape() {
    return !this.isPortrait && this.scale.width >= 768;
  }

  private isHitboxOverlayMode() {
    if (typeof window === "undefined") {
      return false;
    }

    const value = new URLSearchParams(window.location.search).get("hitbox");
    return value === "1" || value === "true";
  }

  private registerPageAudioHandlers() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("pagehide", this.handlePageHidden);
    window.addEventListener("pageshow", this.handlePageVisible);
    window.addEventListener("blur", this.handlePageHidden);
    window.addEventListener("focus", this.handlePageVisible);
  }

  private unregisterPageAudioHandlers() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("pagehide", this.handlePageHidden);
    window.removeEventListener("pageshow", this.handlePageVisible);
    window.removeEventListener("blur", this.handlePageHidden);
    window.removeEventListener("focus", this.handlePageVisible);
  }

  private get judgeZ() {
    if (this.isPortrait && this.gameStarted) {
      return this.portraitVisualJudgeZ;
    }

    return this.isDesktopLandscape && this.gameStarted ? 0.7 : GAME_BALANCE.obstacleJudgeZ;
  }

  private get portraitVisualJudgeZ() {
    const track = this.getTrackLayout();
    const basePoint = this.getLaneCenterPoint(track, 1, GAME_BALANCE.playerZ);
    const visualCenterY = basePoint.y + (56 + this.layoutTuning.characterY * 4) * this.screenScale;
    const visualZ = (visualCenterY - track.topY) / Math.max(1, track.bottomY - track.topY);
    return Phaser.Math.Clamp(visualZ, 0.62, 0.94);
  }

  private getTrackLayout(): TrackLayout {
    const { width, height } = this.scale;
    const mode = this.isPortrait ? "portrait" : "landscape";
    const layoutTuning = this.effectiveLayoutTuning;
    const trackYOffset = height * layoutTuning.trackY * 0.01;
    const farYOffset = height * layoutTuning.farY * 0.01;
    const farWidthScale = 1 + layoutTuning.farW * 0.035;
    const nearWidthScale = Phaser.Math.Clamp(1 + layoutTuning.nearW * 0.035, 0.16, 2.5) * (this.gameStarted ? (this.isPortrait ? 1.38 : 1.22) : 1);

    const topY = height * (this.isDesktopLandscape && this.gameStarted ? 0.19 : GAME_BALANCE.trackTopYRatio[mode]) + trackYOffset + farYOffset;
    const baseBottomY = height * (this.isDesktopLandscape && this.gameStarted ? 0.96 : GAME_BALANCE.trackBottomYRatio[mode]) + trackYOffset;
    const bottomY = this.gameStarted ? Math.max(baseBottomY, height * (this.isPortrait ? 1.06 : 1.04)) : baseBottomY;
    const desktopGameTrackWidthRatio = 0.38;
    const desktopGameTrackWidthScale = 1 + (layoutTuning.nearW - LAYOUT_TUNING_BASE_NEAR_W) * 0.025;
    const desktopGameTrackBottomWidth = width * desktopGameTrackWidthRatio * desktopGameTrackWidthScale;
    const desktopGameTrackTopWidth = desktopGameTrackBottomWidth * 0.18;
    const desktopGameTrackTopMinWidth = width * 0.012;
    const topWidth = this.isDesktopLandscape && this.gameStarted
      ? Math.max(desktopGameTrackTopWidth * farWidthScale, desktopGameTrackTopMinWidth)
      : Phaser.Math.Clamp(width * GAME_BALANCE.trackTopWidthRatio[mode] * farWidthScale, width * 0.08, width * 0.52);
    const bottomWidth = this.isDesktopLandscape && this.gameStarted
      ? desktopGameTrackBottomWidth
      : Phaser.Math.Clamp(
          width * GAME_BALANCE.trackBottomWidthRatio[mode] * nearWidthScale,
          width * (this.isPortrait && this.gameStarted ? 0.22 : 0.5),
          width * (this.gameStarted ? 1.48 : 1.08)
        );

    return {
      centerX: width / 2,
      topY,
      bottomY,
      topWidth,
      bottomWidth
    };
  }

  private drawTrack(track: TrackLayout) {
    const graphics = this.trackGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    if (this.isDesktopLandscape && this.gameStarted) {
      this.drawDesktopGameLanes(graphics, track);
      return;
    }

    this.drawBackdrop(graphics, track);
    this.drawLaneSurfaces(graphics, track);
    this.drawLaneCenterDashes(graphics, track);
  }

  private drawDesktopGameLanes(graphics: Phaser.GameObjects.Graphics, track: TrackLayout) {
    const scale = this.screenScale;
    const laneAlpha = this.feverActive ? 0.9 : 0.78;
    const edgeAlpha = this.feverActive ? 0.54 : 0.38;

    for (let boundary = 0; boundary <= GAME_BALANCE.laneCount; boundary += 1) {
      const start = this.getLaneBoundaryPoint(track, boundary, 0.08);
      const end = this.getLaneBoundaryPoint(track, boundary, 0.98);
      const isOuter = boundary === 0 || boundary === GAME_BALANCE.laneCount;
      graphics.lineStyle(isOuter ? 3.4 * scale : 2.4 * scale, 0xffffff, isOuter ? edgeAlpha : 0.3);
      graphics.beginPath();
      graphics.moveTo(start.x, start.y);
      graphics.lineTo(end.x, end.y);
      graphics.strokePath();
    }

    this.drawLaneCenterDashes(graphics, track, laneAlpha);
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
    const edgeAlpha = 0.08 + pulse * 0.06;

    graphics.fillStyle(this.themeColor("line"), 0.12 + pulse * 0.08);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(this.themeColor("rightLane"), edgeAlpha);
    graphics.fillRect(0, 0, 10 * scale, height);
    graphics.fillRect(width - 10 * scale, 0, 10 * scale, height);
    graphics.fillStyle(this.themeColor("accent"), 0.06 + pulse * 0.05);
    graphics.fillRect(0, 0, width, 8 * scale);
    graphics.fillRect(0, height - 8 * scale, width, 8 * scale);
    graphics.lineStyle(3 * scale, this.themeColor("accent"), 0.22 + pulse * 0.12);
    graphics.strokeRoundedRect(10 * scale, 10 * scale, width - 20 * scale, height - 20 * scale, 18 * scale);

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

  private drawLaneCenterDashes(graphics: Phaser.GameObjects.Graphics, track: TrackLayout, alphaScale = 1) {
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

        graphics.lineStyle(lineWidth, 0xffffff, Phaser.Math.Linear(0.22, 0.7, z) * alphaScale);
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

  private layoutHitboxOverlay(track: TrackLayout) {
    const graphics = this.hitboxGuideGraphics;
    const visible = this.hitboxOverlayEnabled && this.gameStarted;

    graphics?.clear();
    this.hitboxMarkers.forEach((marker) => {
      marker.setVisible(false).setAlpha(0);
    });

    if (!graphics || !visible) {
      return;
    }

    const z = this.judgeZ;
    const scale = this.screenScale;
    const left = this.getLaneBoundaryPoint(track, 0, z);
    const right = this.getLaneBoundaryPoint(track, GAME_BALANCE.laneCount, z);
    const lineWidth = Phaser.Math.Clamp(4 * scale, 3, 7);
    const markerRadius = Phaser.Math.Clamp(26 * scale, 18, 38);

    graphics.lineStyle(lineWidth + 4, 0x1a1a1a, 0.72);
    graphics.beginPath();
    graphics.moveTo(left.x, left.y);
    graphics.lineTo(right.x, right.y);
    graphics.strokePath();

    graphics.lineStyle(lineWidth, 0xffffff, 0.92);
    graphics.beginPath();
    graphics.moveTo(left.x, left.y);
    graphics.lineTo(right.x, right.y);
    graphics.strokePath();

    this.hitboxMarkers.forEach((marker, lane) => {
      const point = this.getLaneCenterPoint(track, lane, z);
      marker
        .setPosition(point.x, point.y)
        .setRadius(markerRadius)
        .setFillStyle(this.runnerColor(lane), 0.42)
        .setStrokeStyle(Math.max(2, lineWidth * 0.7), 0xffffff, 0.96)
        .setAlpha(1)
        .setVisible(true);
    });
  }

  private layoutPlayers(track: TrackLayout) {
    const runnerScreenScale = Math.max(this.screenScale, this.isPortrait ? RUNNER_MIN_SCREEN_SCALE : this.screenScale);
    const playerScale =
      Phaser.Math.Linear(0.45, 1.16, GAME_BALANCE.playerZ) *
      runnerScreenScale *
      this.getLaneResponsiveScale(track) *
      (this.isPortrait && this.gameStarted ? this.portraitCharacterScale : 1) *
      (this.isPortrait && this.gameStarted ? 0.88 : 1);

    this.runners.forEach((runner) => {
      const playerPoint = this.getPlayerLaneCenterPoint(track, runner.lane);
      const portraitPlayerX = this.isPortrait && this.gameStarted ? this.layoutTuning.characterX * 4 * this.screenScale : 0;
      const portraitPlayerDrop = this.isPortrait && this.gameStarted ? (56 + this.layoutTuning.characterY * 4) * this.screenScale : 0;
      const playerY = playerPoint.y + (this.isDesktopLandscape && this.gameStarted ? 58 * this.screenScale : portraitPlayerDrop);

      runner.container.setX(playerPoint.x + portraitPlayerX).setScale(playerScale).setAngle(runner.isJumping ? runner.container.angle : 0);
      if (!runner.isJumping) {
        runner.container.setY(playerY);
      }
      runner.body.setAlpha(0).setFillStyle(this.runnerColor(runner.lane), 1);
      runner.face.setFillStyle(this.themeColor("background"), 1);
      runner.shadow.setFillStyle(this.themeColor("shadow"), 0).setVisible(false);
      runner.face.setScale(runner.isJumping ? 1.08 : 1, runner.isJumping ? 0.92 : 1);
      runner.assetImage
        ?.setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT)
        .setX(this.getPortraitRunnerSpriteOffset(runner.lane))
        .setAlpha(1);
      runner.shadow.setScale(runner.isJumping ? 0.72 : 1, runner.isJumping ? 0.7 : 1).setAlpha(0);
      if (!runner.isJumping) {
        this.startRunnerIdleAnimation(runner);
      }
    });
  }

  private drawRunnerFeverLayer() {
    const graphics = this.runnerFeverGraphics;
    if (!graphics) {
      return;
    }

    graphics.clear();
    if (!this.feverActive || !this.gameStarted) {
      return;
    }

    const pulse = this.feverPulse;
    this.runners.forEach((runner) => {
      if (runner.container.alpha <= 0) {
        return;
      }

      const laneColor = this.runnerColor(runner.lane);
      const x = this.getRunnerVisualCenterX(runner);
      const footY = runner.container.y + 58 * runner.container.scaleY;
      const footWidth = 132 * runner.container.scaleX;
      const footHeight = 32 * runner.container.scaleY;

      graphics.fillStyle(laneColor, 0.2 + pulse * 0.08);
      graphics.fillEllipse(x, footY, footWidth, footHeight);
      graphics.lineStyle(3 * this.screenScale, this.themeColor("accent"), 0.24 + pulse * 0.16);
      graphics.strokeEllipse(x, footY, footWidth * 1.1, footHeight * 1.24);
      graphics.lineStyle(2 * this.screenScale, this.themeColor("secondary"), 0.18 + pulse * 0.12);
      graphics.strokeEllipse(x, footY, footWidth * 0.78, footHeight * 0.88);
    });
  }

  private getPortraitRunnerSpriteOffset(lane: number) {
    if (!this.isPortrait || !this.gameStarted) {
      return 0;
    }

    if (lane === 0) {
      return -40;
    }

    if (lane === 2) {
      return 40;
    }

    return 0;
  }

  private getRunnerVisualCenterX(runner: Runner) {
    return runner.container.x + (runner.assetImage?.x ?? 0) * runner.container.scaleX;
  }

  private startRun() {
    if (this.gameStarted) {
      return;
    }

    this.gameStarted = true;
    this.gameEnded = false;
    this.finishPending = false;
    this.rebuildDifficultyChart();
    const runStartDelayMs = RUN_START_DELAY_MS;
    this.startTime = this.time.now + runStartDelayMs;
    this.nextChartIndex = 0;
    this.nextItemIndex = 0;
    this.judgedGroupIds.clear();
    this.clearLaneInputHistory();
    this.score = 0;
    this.avoidCount = 0;
    this.combo = 0;
    this.missCount = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.niceCount = 0;
    this.runners.forEach((runner) => {
      runner.isJumping = false;
    });
    this.clearLaneInputHistory();
    this.lastMissEffectAt = 0;
    this.lastLayoutRefreshAt = 0;
    this.setFeverActive(false);
    this.clearObstacles();
    this.clearItems();
    this.stopMenuBgm();
    this.bgm?.stop();
    this.time.delayedCall(runStartDelayMs, () => {
      if (!this.gameStarted || this.finishPending) {
        return;
      }

      if (this.audioSettings.bgmEnabled) {
        this.bgm?.play();
      }
    });

    this.hideResultLabels();

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

    this.layout();
  }

  private loadChart() {
    const rawChart = this.cache.json.get(this.selectedChartKey) as BeatmapChart | undefined;
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
    if (this.selectedSong.preserveAuthoredChart) {
      return chart.obstacles
        .filter((obstacle) => obstacle.lane >= 0 && obstacle.lane < GAME_BALANCE.laneCount)
        .sort((a, b) => a.time - b.time);
    }

    const baseRatio = 1 / DIFFICULTY_SETTINGS[this.selectedDifficulty].authoredStep;
    const targetRatio = Phaser.Math.Clamp(baseRatio, 0.08, 0.75);
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
      const intervalSeconds = difficulty.intervalSeconds;
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

    this.beginFinishRun();
    return true;
  }

  private beginFinishRun() {
    if (this.finishPending || !this.gameStarted) {
      return;
    }

    this.finishPending = true;
    this.bgm?.stop();
    this.popFinishFeedback(() => this.finishRun());
  }

  private finishRun() {
    if (this.gameEnded || !this.finishPending) {
      return;
    }

    this.gameStarted = false;
    this.gameEnded = false;
    this.finishPending = false;
    this.bgm?.stop();
    this.clearObstacles();
    this.clearItems();
    this.setFeverActive(false);
    this.showResultScreen();
  }

  private loadRankings() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawRankings = window.localStorage.getItem(RANKINGS_STORAGE_KEY);
      const rankings = rawRankings ? (JSON.parse(rawRankings) as RankingEntry[]) : [];
      this.setRankings(rankings);
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
    this.saveRankingsToStorage();
    this.layout();
  }

  private saveRankingsToStorage() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(RANKINGS_STORAGE_KEY, JSON.stringify(this.rankings));
    } catch {
      // Ranking persistence is best-effort; gameplay should never fail if storage is unavailable.
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
    const body = this.add.ellipse(0, 0, 30, 30, this.getItemColor(itemType), 1);
    const detail = this.createItemDetail(itemType);
    const assetImage = this.createThemeImage(this.getItemAssetKey(itemType), 0, 0, 1);
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

      if (obstacle.isPopping) {
        return true;
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
    const obstacleSizeScale = this.isDesktopLandscape ? 0.58 : this.isPortrait ? 0.64 * this.portraitItemScale : 1;
    const visualWidth = Phaser.Math.Clamp((laneWidth / scale) * 1.08 * obstacleSizeScale, this.isPortrait ? 38 : 64, 176);
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
    const itemSizeScale = this.isDesktopLandscape ? 0.56 : this.isPortrait ? 0.64 * this.portraitItemScale : 1;
    const imageSize = Phaser.Math.Clamp((laneWidth / scale) * 1.34 * itemSizeScale, this.isPortrait ? 42 : 78, 228);
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
    const assetKey = this.getItemAssetKey(item.itemType);
    if (item.assetImage && assetKey && item.assetImage.texture.key !== assetKey && this.textures.exists(assetKey)) {
      item.assetImage.setTexture(assetKey);
    }
    item.assetImage?.setDisplaySize(imageSize, imageSize);
  }

  private getItemAssetKey(itemType: ItemVisualType) {
    if (this.feverActive && itemType === "music_note") {
      return this.currentThemeAssets.items.music_note_fever ?? this.currentThemeAssets.items[itemType];
    }

    return this.currentThemeAssets.items[itemType];
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

  private getJudgeFeedbackText(judgeText: string) {
    if (judgeText === "◎") {
      return "PERFECT";
    }

    if (judgeText === "○") {
      return "GOOD";
    }

    if (judgeText === "△") {
      return "NICE";
    }

    return "MISS";
  }

  private getItemJudgeFeedbackText(judgeText: string) {
    return `${judgeText} ${this.getJudgeFeedbackText(judgeText)}`;
  }

  private getJudgeFeedbackScale(judgeText: string) {
    return judgeText === "◎" ? 0.72 : 0.82;
  }

  private getPerformanceCueVisualSize(_lane: number) {
    return { width: 1, height: 1 };
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
      return this.themeColor("rightLane");
    }

    return this.themeColor("accent");
  }

  private getJudgeColor(judgeText: string) {
    if (judgeText === "◎") {
      return 0xff7aa2;
    }

    if (judgeText === "○") {
      return 0x6bcb77;
    }

    if (judgeText === "△") {
      return 0x4aa9f2;
    }

    return 0xff4f5e;
  }

  private getResultStatColor(kind: ResultStatKind) {
    if (kind === "perfect") {
      return this.colorNumberToHex(this.getJudgeColor("◎"));
    }

    if (kind === "good") {
      return this.colorNumberToHex(this.getJudgeColor("○"));
    }

    if (kind === "nice") {
      return this.colorNumberToHex(this.getJudgeColor("△"));
    }

    if (kind === "miss") {
      return this.colorNumberToHex(this.getJudgeColor("×"));
    }

    return "#6B4326";
  }

  private judgeItem(item: CollectibleItem, z: number) {
    if (item.collected || item.judged || z < this.judgeZ) {
      return;
    }

    const judgeText = this.getJudgeTextForTiming(item.hitTime, item.lane, false);
    if (judgeText === "×") {
      item.judged = true;
      this.spawnItemMissEffects(item);
      this.destroyItem(item);
      this.layout();
      return;
    }

    item.collected = true;
    this.score += item.score;
    if (this.audioSettings.seEnabled) {
      this.itemSe?.play();
    }
    this.spawnItemCollectEffects(item, judgeText);
    this.destroyItem(item);
    this.layout();
  }

  private judgeObstacle(obstacle: Obstacle, z: number) {
    if (obstacle.judged || this.judgedGroupIds.has(obstacle.groupId) || z < this.judgeZ) {
      return;
    }

    const judgeText = this.getJudgeTextForTiming(obstacle.hitTime, obstacle.lane);
    const groupObstacles = this.obstacles.filter((candidate) => candidate.groupId === obstacle.groupId);
    groupObstacles.forEach((candidate) => {
      candidate.judged = true;
    });
    this.judgedGroupIds.add(obstacle.groupId);

    if (judgeText !== "×") {
      this.registerAvoid(groupObstacles, obstacle, judgeText);
      return;
    }

    this.registerMiss(groupObstacles);
  }

  private registerAvoid(obstacles: Obstacle[], judgedObstacle: Obstacle, judgeText: string) {
    this.combo += 1;
    this.avoidCount += 1;
    this.registerJudgeCount(judgeText);
    const difficulty = DIFFICULTY_SETTINGS[this.selectedDifficulty];
    const scoreGain = Math.round((100 + Math.min(this.combo, 20) * 10) * difficulty.scoreMultiplier);
    this.score += scoreGain;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    obstacles.forEach((obstacle) => {
      if (!this.isObstacleAlive(obstacle)) {
        return;
      }

      obstacle.body.setFillStyle(this.themeColor("secondary"), 1);
      obstacle.shine.setFillStyle(this.themeColor("line"), 0.95);
      this.fadeOutPanel(obstacle);
    });
    const enteredFever = !this.feverActive && this.combo >= GAME_BALANCE.feverComboThreshold;
    this.spawnSuccessEffects(judgedObstacle, judgeText);
    if (enteredFever) {
      this.setFeverActive(true);
    }
    this.playRunnerPerformance(judgedObstacle.lane);
    this.triggerComboMilestone();
    this.pulseHudLabel(this.comboLabel);
    this.pulseHudLabel(this.scoreLabel);
    this.refreshHudLayout();
  }

  private registerJudgeCount(judgeText: string) {
    if (judgeText === "◎") {
      this.perfectCount += 1;
      return;
    }

    if (judgeText === "○") {
      this.goodCount += 1;
      return;
    }

    if (judgeText === "△") {
      this.niceCount += 1;
    }
  }

  private registerMiss(obstacles: Obstacle[]) {
    this.combo = 0;
    this.comboMilestoneLabel?.setText("").setAlpha(0);
    this.missCount += 1;
    this.setFeverActive(false);
    const missPoint = obstacles.find((obstacle) => this.isObstacleAlive(obstacle));
    obstacles.forEach((obstacle) => {
      if (!this.isObstacleAlive(obstacle)) {
        return;
      }

      obstacle.body.setFillStyle(this.themeColor("primary"), 1);
      obstacle.shine.setFillStyle(this.themeColor("accent"), 0.95);
      obstacle.container.setAlpha(1);
    });
    if (this.time.now - this.lastMissEffectAt > 180) {
      this.lastMissEffectAt = this.time.now;
      this.cameras.main.shake(70, 0.0017);
      this.flashRunner(obstacles[0]?.lane ?? 1);
      if (missPoint) {
        this.spawnMissEffects(missPoint);
      }
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
      ease: "Back.Out",
    });
  }

  private clearLaneInputHistory() {
    this.laneInputHistory.forEach((history) => {
      history.length = 0;
    });
  }

  private recordLaneInput(lane: number) {
    const history = this.laneInputHistory[lane];
    if (!history) {
      return;
    }

    const now = this.songTimeSeconds;
    history.push(now);
    while (history.length > 8) {
      history.shift();
    }
    this.pruneLaneInputHistory(lane, now - 1);
  }

  private pruneLaneInputHistory(lane: number, minTime: number) {
    const history = this.laneInputHistory[lane];
    if (!history) {
      return;
    }

    while (history.length > 0 && (history[0] ?? 0) < minTime) {
      history.shift();
    }
  }

  private getJudgeTextForTiming(hitTime: number, lane: number, consumeInput = true) {
    const targetTime = this.getJudgeTargetTime(hitTime);
    const history = this.laneInputHistory[lane];
    if (!history) {
      return "×";
    }

    this.pruneLaneInputHistory(lane, targetTime - JUDGE_WINDOWS_SECONDS.nice);

    let bestIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;
    history.forEach((inputTime, index) => {
      const delta = Math.abs(inputTime - targetTime);
      if (delta <= JUDGE_WINDOWS_SECONDS.nice && delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    });

    if (bestIndex < 0) {
      return "×";
    }

    if (consumeInput) {
      history.splice(bestIndex, 1);
    }
    const delta = bestDelta;
    if (delta <= JUDGE_WINDOWS_SECONDS.perfect) {
      return "◎";
    }

    if (delta <= JUDGE_WINDOWS_SECONDS.good) {
      return "○";
    }

    if (delta <= JUDGE_WINDOWS_SECONDS.nice) {
      return "△";
    }

    return "×";
  }

  private getJudgeTargetTime(hitTime: number) {
    const approachTime = this.chartApproachTime;
    const spawnTime = hitTime - approachTime;
    const judgeProgress =
      (this.judgeZ - GAME_BALANCE.obstacleSpawnZ) / Math.max(0.001, GAME_BALANCE.obstacleDespawnZ - GAME_BALANCE.obstacleSpawnZ);

    return spawnTime + approachTime * judgeProgress;
  }

  private spawnSuccessEffects(obstacle: Obstacle, judgeText: string) {
    if (!this.isObstacleAlive(obstacle)) {
      return;
    }

    const color = this.getJudgeColor(judgeText);
    this.cameras.main.shake(this.feverActive ? 65 : 45, this.feverActive ? 0.002 : 0.0012);
    this.spawnSuccessDotPop(obstacle, color);
    const inwardOffset = (1 - obstacle.lane) * 16 * this.screenScale;
    const feedbackX = obstacle.container.x + inwardOffset;
    this.spawnStickerText(
      this.getJudgeFeedbackText(judgeText),
      feedbackX,
      obstacle.container.y - 72 * obstacle.container.scaleY,
      color,
      this.getJudgeFeedbackScale(judgeText)
    );
  }

  private spawnSuccessDotPop(obstacle: Obstacle, color: number) {
    const originX = obstacle.container.x;
    const originY = obstacle.container.y - 22 * obstacle.container.scaleY;

    [-1, 1].forEach((direction) => {
      const dot = this.createParticleShape(originX, originY, color, "star").setDepth(370);
      this.tweens.add({
        targets: dot,
        x: originX + direction * Phaser.Math.FloatBetween(20, 30) * this.screenScale,
        y: originY - Phaser.Math.FloatBetween(10, 18) * this.screenScale,
        alpha: 0,
        scale: 0.35,
        duration: 260,
        ease: "Sine.Out",
        onComplete: () => dot.destroy()
      });
    });
  }

  private spawnItemCollectEffects(item: CollectibleItem, judgeText: string) {
    if (!this.isItemAlive(item)) {
      return;
    }

    const color = this.getJudgeColor(judgeText);
    const feedbackX = item.container.x;
    const feedbackY = item.container.y - 56 * item.container.scaleY;
    this.spawnRunnerHeadStarBurst(item.lane, color);
    this.spawnStickerText(
      this.getItemJudgeFeedbackText(judgeText),
      feedbackX,
      feedbackY,
      color,
      this.getJudgeFeedbackScale(judgeText)
    );
    this.pulseHudLabel(this.scoreLabel);
  }

  private spawnItemMissEffects(item: CollectibleItem) {
    if (!this.isItemAlive(item)) {
      return;
    }

    const color = this.getJudgeColor("×");
    const feedbackX = item.container.x;
    const feedbackY = item.container.y - 56 * item.container.scaleY;
    this.spawnRunnerHeadStarBurst(item.lane, color);
    this.spawnStickerText(this.getItemJudgeFeedbackText("×"), feedbackX, feedbackY, color, this.getJudgeFeedbackScale("×"));
  }

  private spawnSuccessDotPopAt(originX: number, originY: number, color: number) {
    [-1, 1].forEach((direction) => {
      const dot = this.createParticleShape(originX, originY, color, "star").setDepth(370);
      this.tweens.add({
        targets: dot,
        x: originX + direction * Phaser.Math.FloatBetween(20, 30) * this.screenScale,
        y: originY - Phaser.Math.FloatBetween(10, 18) * this.screenScale,
        alpha: 0,
        scale: 0.35,
        duration: 260,
        ease: "Sine.Out",
        onComplete: () => dot.destroy()
      });
    });
  }

  private spawnTextStarBurst(originX: number, originY: number, color: number) {
    const burstY = originY - 20 * this.screenScale;
    [-1, -0.45, 0.45, 1].forEach((direction, index) => {
      const dot = this.createParticleShape(originX, burstY, color, "star").setDepth(362);
      this.tweens.add({
        targets: dot,
        x: originX + Phaser.Math.FloatBetween(22, 46) * this.screenScale * direction,
        y: burstY - Phaser.Math.FloatBetween(24, 52) * this.screenScale - (index % 2) * 10 * this.screenScale,
        alpha: 0,
        scale: 0.42,
        duration: 430,
        ease: "Sine.Out",
        onComplete: () => dot.destroy()
      });
    });
  }

  private spawnRunnerHeadStarBurst(lane: number, color: number) {
    const runner = this.runners[lane];
    if (!runner) {
      return;
    }

    const x = this.getRunnerVisualCenterX(runner);
    const y = runner.container.y - 82 * runner.container.scaleY;
    this.spawnTextStarBurst(x, y, color);
  }

  private spawnRunnerFeverPulse(lane: number) {
    const runner = this.runners[lane];
    if (!runner) {
      return;
    }

    const x = this.getRunnerVisualCenterX(runner);
    const y = runner.container.y + 4 * runner.container.scaleY;
    const laneColor = this.runnerColor(lane);
    const ring = this.add.ellipse(x, y, 138 * runner.container.scaleX, 150 * runner.container.scaleY, laneColor, 0);
    ring.setDepth(runner.container.depth + 4).setStrokeStyle(5 * this.screenScale, this.themeColor("accent"), 0.76);
    const ring2 = this.add.ellipse(x, y, 112 * runner.container.scaleX, 126 * runner.container.scaleY, laneColor, 0);
    ring2.setDepth(runner.container.depth + 3).setStrokeStyle(3 * this.screenScale, this.themeColor("secondary"), 0.58);

    this.tweens.add({
      targets: [ring, ring2],
      scaleX: 1.36,
      scaleY: 1.28,
      alpha: 0,
      duration: 320,
      ease: "Sine.Out",
      onComplete: () => {
        ring.destroy();
        ring2.destroy();
      }
    });

  }

  private spawnMissEffects(obstacle: Obstacle) {
    const inwardOffset = (1 - obstacle.lane) * 16 * this.screenScale;
    const color = this.getJudgeColor("×");
    const missPoint = this.getVisibleJudgePoint(obstacle.lane);
    const feedbackX = missPoint.x + inwardOffset;
    const feedbackY = missPoint.y - 68 * this.screenScale;
    this.spawnSuccessDotPopAt(feedbackX, feedbackY + 34 * this.screenScale, color);
    this.spawnStickerText("MISS", feedbackX, feedbackY, color, this.getJudgeFeedbackScale("×"));
    const puff = this.add.ellipse(
      missPoint.x,
      missPoint.y,
      58 * this.screenScale,
      34 * this.screenScale,
      this.themeColor("primary"),
      0.18
    );
    puff.setDepth(obstacle.container.depth + 24);
    this.tweens.add({
      targets: puff,
      alpha: 0,
      scaleX: 1.45,
      scaleY: 1.1,
      duration: 260,
      ease: "Sine.Out",
      onComplete: () => puff.destroy()
    });
    this.spawnParticleBurst(missPoint.x, missPoint.y, {
      color: this.themeColor("primary"),
      count: 8,
      distance: 30,
      kind: "circle",
      duration: 320
    });
  }

  private getVisibleJudgePoint(lane: number) {
    const track = this.getTrackLayout();
    return this.getLaneCenterPoint(track, lane, this.judgeZ);
  }

  private triggerComboMilestone() {
    if (![10, 30, 50, 100].includes(this.combo)) {
      return;
    }

    const scale = Math.max(this.screenScale, 0.94);
    const labelX = this.comboLabel?.x ?? 88 * scale;
    const labelY = this.comboLabel?.y ?? (181 + HUD_NUMBER_Y_OFFSET) * scale;
    const x = labelX;
    const y = labelY + 45 * scale;
    const text = `${this.combo} COMBO`;
    const color = 0xf6529f;
    const milestoneLabel = this.comboMilestoneLabel;
    milestoneLabel
      ?.setText(text)
      .setPosition(x, y)
      .setColor(this.colorNumberToHex(color))
      .setAlpha(1)
      .setScale(1);
    if (milestoneLabel) {
      this.tweens.killTweensOf(milestoneLabel);
      this.tweens.add({
        targets: milestoneLabel,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 130,
        yoyo: true,
        ease: "Back.Out"
      });
    }
    this.spawnParticleBurst(x, y + 8 * scale, {
      color,
      colors: [this.themeColor("primary"), this.themeColor("accent"), this.themeColor("line")],
      count: this.combo >= 50 ? 22 : 12,
      distance: this.combo >= 50 ? 54 : 36,
      kind: this.combo >= 30 ? "note" : "circle",
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

    obstacle.isPopping = true;
    this.tweens.killTweensOf(obstacle.container);
    this.tweens.add({
      targets: obstacle.container,
      alpha: 1,
      duration: 1,
      onComplete: () => {
        this.tweens.add({
          targets: obstacle.container,
          scaleX: obstacle.container.scaleX * 1.08,
          scaleY: obstacle.container.scaleY * 1.08,
          duration: 90,
          ease: "Back.Out",
          onComplete: () => {
            this.tweens.add({
              targets: obstacle.container,
              alpha: 0,
              duration: 150,
              ease: "Sine.Out",
              onComplete: () => this.destroyObstacle(obstacle)
            });
          }
        });
      }
    });

    if (!obstacle.assetImage) {
      return;
    }

    const baseScaleX = obstacle.assetImage.scaleX;
    const baseScaleY = obstacle.assetImage.scaleY;
    this.tweens.killTweensOf(obstacle.assetImage);
    this.tweens.add({
      targets: obstacle.assetImage,
      scaleX: baseScaleX * 1.08,
      scaleY: baseScaleY * 1.08,
      duration: 90,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: obstacle.assetImage,
          scaleX: baseScaleX * 0.96,
          scaleY: baseScaleY * 0.96,
          duration: 150,
          ease: "Sine.Out"
        });
      }
    });
  }

  private popFeedback(text: string, color: string, durationMs = 480, finalScale = 1.42) {
    const label = this.feedbackLabel;
    if (!label) {
      return;
    }

    this.tweens.killTweensOf(label);
    label
      .setText(text)
      .setColor(color)
      .setStroke("#FFF7DC", Math.max(4, Math.round(6 * this.screenScale)))
      .setShadow(0, Math.round(4 * this.screenScale), "rgba(107, 62, 36, 0.32)", 2, true, true)
      .setAlpha(1)
      .setScale(1)
      .setAngle(Phaser.Math.Between(-4, 4));

    this.tweens.add({
      targets: label,
      alpha: 0,
      scale: finalScale,
      angle: label.angle * 0.45,
      duration: durationMs,
      ease: "Back.Out",
    });
  }

  private popFinishFeedback(onComplete: () => void) {
    const label = this.feedbackLabel;
    if (!label) {
      onComplete();
      return;
    }

    const { width, height } = this.scale;
    const baseFontSize = Math.round(Phaser.Math.Clamp(54 * this.screenScale, 44, 86));
    this.tweens.killTweensOf(label);
    label
      .setText("FINISH!")
      .setPosition(width / 2, height / 2)
      .setFontSize(baseFontSize)
      .setColor("#F6525C")
      .setStroke("#FFF7DC", Math.max(7, Math.round(10 * this.screenScale)))
      .setShadow(0, Math.round(7 * this.screenScale), "rgba(107, 62, 36, 0.34)", 3, true, true)
      .setAlpha(0)
      .setScale(0.72)
      .setAngle(-2)
      .setDepth(380);

    this.tweens.add({
      targets: label,
      alpha: 1,
      scale: 1.16,
      angle: 0,
      duration: 360,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: label,
          alpha: 0,
          scale: 1.32,
          y: height / 2 - 18 * this.screenScale,
          delay: Math.max(720, RUN_FINISH_DELAY_MS - 1120),
          duration: 760,
          ease: "Sine.InOut",
          onComplete
        });
      }
    });
  }

  private spawnStickerText(text: string, x: number, y: number, color: number, scale = 1) {
    const isJudgeSymbol = text === "◎" || text === "○" || text === "△" || text === "×";
    if (isJudgeSymbol) {
      return;
    }

    const fillColor = this.colorNumberToHex(color);
    const sticker = this.add.text(x, y, text, {
      fontFamily: UI_FONT,
      fontStyle: "900",
      color: fillColor,
      padding: {
        x: Math.round(4 * this.screenScale),
        y: Math.round(2 * this.screenScale)
      }
    });

    sticker
      .setOrigin(0.5)
      .setDepth(360)
      .setFontSize(Math.round(28 * this.screenScale * scale))
      .setAngle(Phaser.Math.Between(-7, 7))
      .setStroke("#FFF7DC", Math.max(4, Math.round(6 * this.screenScale * scale)))
      .setShadow(0, Math.round(4 * this.screenScale), "rgba(107, 62, 36, 0.34)", 2, true, true)
      .setAlpha(0)
      .setScale(0.58);

    this.tweens.add({
      targets: sticker,
      alpha: 1,
      scale: 1.08,
      y: y - 14 * this.screenScale,
      duration: 135,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: sticker,
          alpha: 0,
          scale: 1.32,
          y: y - 54 * this.screenScale,
          duration: 380,
          ease: "Sine.Out",
          onComplete: () => sticker.destroy()
        });
      }
    });
  }

  private spawnParticleBurst(
    x: number,
    y: number,
    options: {
      color: number;
      colors?: number[];
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
      const color = options.colors?.[index % options.colors.length] ?? options.color;
      const particle = this.createParticleShape(x, y, color, options.kind);

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
      return this.createSolidNoteParticle(x, y, color);
    }

    if (kind === "circle") {
      return this.add.ellipse(x, y, 11 * this.screenScale, 11 * this.screenScale, color, 0.86);
    }

    const graphics = this.add.graphics({ x, y });
    graphics.fillStyle(color, 0.95);
    this.fillGraphicsStar(graphics, 0, 0, 5, 4.2 * this.screenScale, 9 * this.screenScale);
    graphics.fillStyle(0xffffff, 0.3);
    this.fillGraphicsStar(graphics, -1.5 * this.screenScale, -1.5 * this.screenScale, 5, 1.8 * this.screenScale, 4 * this.screenScale);
    return graphics;
  }

  private createSolidNoteParticle(x: number, y: number, color: number) {
    const scale = this.screenScale * 1.55;
    const shadow = this.add.ellipse(1.5 * scale, 7 * scale, 12 * scale, 8 * scale, 0xffffff, 0.18);
    const stem = this.add.rectangle(4 * scale, -8 * scale, 4.5 * scale, 22 * scale, color, 0.96);
    const flag = this.add.rectangle(10 * scale, -18 * scale, 17 * scale, 5 * scale, color, 0.96);
    const head = this.add.ellipse(-3 * scale, 7 * scale, 15 * scale, 11 * scale, color, 0.96);
    const shine = this.add.ellipse(-6 * scale, 3 * scale, 5 * scale, 3 * scale, 0xffffff, 0.34);

    stem.setOrigin(0.5, 0.5);
    flag.setOrigin(0, 0.5);
    return this.add.container(x, y, [shadow, stem, flag, head, shine]);
  }

  private popResult() {
    const songLabel = this.resultSongLabel;
    if (!songLabel) {
      return;
    }

    const statOrder: ResultStatKind[] = ["maxCombo", "perfect", "good", "nice", "miss"];
    const statLabels = statOrder
      .map((kind) => this.resultStatParts.find((part) => part.kind === kind)?.label)
      .filter((target): target is Phaser.GameObjects.Text => Boolean(target));
    const scoreLabel = this.resultStatParts.find((part) => part.kind === "score")?.label;
    const targets = [songLabel, ...statLabels, scoreLabel].filter((target): target is Phaser.GameObjects.Text => Boolean(target));
    this.tweens.killTweensOf(targets);
    this.resultLabel?.setAlpha(0);
    this.resultScoreLabel?.setAlpha(0);
    this.resultStatsLabel?.setAlpha(0);
    songLabel.setText(this.selectedSong.shortTitle).setAlpha(0);
    this.resultStatParts.forEach((part) => {
      part.label.setText(this.getResultStatText(part.kind)).setAlpha(0);
    });

    this.tweenResultTextIn(songLabel, 180);
    statLabels.forEach((target, index) => {
      this.tweenResultTextIn(target, 620 + index * 145);
    });

    if (scoreLabel) {
      this.tweenResultTextIn(scoreLabel, 1420, () => this.spawnResultConfetti());
    }
  }

  private tweenResultTextIn(target: Phaser.GameObjects.Text, delay: number, onStart?: () => void) {
      const finalY = target.y;
      const finalScaleX = target.scaleX;
      const finalScaleY = target.scaleY;
      target.setY(finalY + 12 * this.screenScale);
      target.setScale(finalScaleX * 0.88, finalScaleY * 0.88);
      this.tweens.add({
        targets: target,
        y: finalY,
        alpha: 1,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        duration: 300,
        delay,
        ease: "Back.Out",
        onStart
      });
  }

  private spawnResultConfetti() {
    const { width, height } = this.scale;
    const colors = [0xf6525c, 0x4aa9f2, 0x6bcb77, 0xffd84d, 0xffffff, 0x68d5c2];
    const count = this.isPortrait ? 34 : 48;
    for (let index = 0; index < count; index += 1) {
      const fromLeft = index % 2 === 0;
      const startX = fromLeft
        ? Phaser.Math.FloatBetween(width * 0.04, width * 0.38)
        : Phaser.Math.FloatBetween(width * 0.62, width * 0.96);
      const startY = Phaser.Math.FloatBetween(-height * 0.08, height * 0.18);
      const color = colors[index % colors.length];
      const piece = this.createResultConfettiPiece(startX, startY, color).setDepth(334);
      const drift = Phaser.Math.FloatBetween(width * 0.05, width * 0.22) * (fromLeft ? 1 : -1);
      this.tweens.add({
        targets: piece,
        x: startX + drift,
        y: height * Phaser.Math.FloatBetween(0.64, 0.96),
        angle: Phaser.Math.Between(-260, 260),
        alpha: 0,
        duration: Phaser.Math.Between(1200, 1850),
        delay: Phaser.Math.Between(0, 260),
        ease: "Sine.In",
        onComplete: () => piece.destroy()
      });
    }
  }

  private createResultConfettiPiece(x: number, y: number, color: number) {
    const scale = Math.max(this.screenScale, 0.85);
    const graphics = this.add.graphics({ x, y });
    graphics.fillStyle(color, 0.92);
    if (Phaser.Math.Between(0, 2) === 0) {
      this.fillGraphicsStar(graphics, 0, 0, 5, 3.4 * scale, 7.5 * scale);
    } else {
      graphics.fillRoundedRect(-4.5 * scale, -2.5 * scale, 9 * scale, 5 * scale, 2 * scale);
    }
    graphics.fillStyle(0xffffff, 0.28);
    graphics.fillCircle(-1.5 * scale, -1.2 * scale, 1.4 * scale);
    graphics.setAlpha(0.95).setAngle(Phaser.Math.Between(-35, 35));
    return graphics;
  }

  private getResultStatText(kind: ResultStatKind) {
    if (kind === "score") {
      return this.score.toString().padStart(5, "0");
    }

    if (kind === "perfect") {
      return `${this.perfectCount}`;
    }

    if (kind === "nice") {
      return `${this.niceCount}`;
    }

    if (kind === "good") {
      return `${this.goodCount}`;
    }

    if (kind === "miss") {
      return `${this.missCount}`;
    }

    return `${this.maxCombo}`;
  }

  private flashRunner(lane: number) {
    const runner = this.runners[lane];
    if (!runner) {
      return;
    }

    this.tweens.killTweensOf(runner.container);
    this.tweens.killTweensOf(runner.body);
    runner.body.setAlpha(0).setFillStyle(this.runnerColor(lane), 1);
    this.setRunnerVisualState(lane, "miss");
    runner.container.setAngle(lane === 0 ? -5 : lane === 2 ? 5 : 0);
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

  private setFeverActive(active: boolean, silent = false) {
    if (this.feverActive === active) {
      return;
    }

    this.feverActive = active;
    this.updateRunnerSpriteSheets();
    this.tweens.killTweensOf(this.feverBackgroundState);
    this.tweens.add({
      targets: this.feverBackgroundState,
      alpha: active ? 0.92 : 0,
      duration: active ? 260 : 180,
      ease: "Sine.Out"
      });
      this.layout();
      const label = this.feverLabel;

      if (active && !silent) {
      const feverTextX = this.isPortrait ? this.scale.width * 0.26 : this.scale.width * 0.28;
      const feverTextY = this.isPortrait ? this.scale.height * 0.245 : this.scale.height * 0.18;
      this.cameras.main.flash(110, 255, 220, 115, false);
      this.cameras.main.shake(75, 0.0018);
      this.spawnParticleBurst(feverTextX, feverTextY + 8 * this.screenScale, {
        color: this.themeColor("accent"),
        colors: [
          this.themeColor("leftLane"),
          this.themeColor("centerLane"),
          this.themeColor("rightLane"),
          this.themeColor("accent"),
          this.themeColor("secondary")
        ],
        count: 18,
        distance: 54,
        kind: "note",
        duration: 520
      });
      this.pulseHudLabel(this.comboLabel);
      this.pulseHudLabel(this.scoreLabel);

      if (label) {
        this.tweens.killTweensOf(label);
        label
          .setText("FEVER!")
          .setPosition(feverTextX, feverTextY)
          .setFontSize(Math.round(Phaser.Math.Clamp(28 * this.screenScale, 24, 42)))
          .setColor(this.currentTheme.colors.accent)
          .setStroke(this.currentTheme.colors.line, Math.round(5 * this.screenScale))
          .setAlpha(0)
          .setScale(0.72)
          .setDepth(362);
        this.tweens.add({
          targets: label,
          alpha: 1,
          scale: 1,
          duration: 150,
          ease: "Back.Out",
          onComplete: () => {
            this.tweens.add({
              targets: label,
              alpha: 0,
              scale: 1.12,
              y: label.y - 8 * this.screenScale,
              delay: 280,
              duration: 260,
              ease: "Sine.Out"
            });
          }
        });
      }
    } else if (label) {
      this.feverGraphics?.clear();
      this.tweens.killTweensOf(label);
      this.tweens.add({
        targets: label,
        alpha: 0,
        scale: 0.9,
        duration: 180,
        ease: "Sine.Out"
      });
    }
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

  private get selectedChartKey() {
    if (this.selectedSong.chartFiles?.[this.selectedDifficulty]) {
      return `${this.selectedSong.chartKey}_${this.selectedDifficulty}`;
    }

    return this.selectedSong.chartKey;
  }

  private get currentTheme(): ThemeConfig {
    if (this.gameStarted || this.gameEnded) {
      return this.getThemeById(this.activeGameplayThemeId);
    }

    return this.getThemeById(this.selectedSong.themeId);
  }

  private get currentThemeAssets(): ThemeAssetConfig {
    if (this.gameStarted || this.gameEnded) {
      return this.getThemeAssetsById(this.activeGameplayThemeId);
    }

    return this.getThemeAssetsById(this.selectedSong.themeId);
  }

  private get activeGameplayThemeId(): ThemeId {
    return this.feverActive ? FEVER_GAMEPLAY_THEME_ID : NORMAL_GAMEPLAY_THEME_ID;
  }

  private getThemeById(themeId: ThemeId) {
    return THEMES[themeId] ?? DEFAULT_THEME;
  }

  private getThemeAssetsById(themeId: ThemeId) {
    return THEME_ASSETS[themeId] ?? THEME_ASSETS["tiny-toy-sprint"];
  }

  private themeColor(colorName: keyof ThemeConfig["colors"]) {
    return toColorNumber(this.currentTheme.colors[colorName]);
  }

  private colorNumberToHex(color: number) {
    return `#${color.toString(16).padStart(6, "0").slice(-6)}`;
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

  private coverImageInBox(image: Phaser.GameObjects.Image | undefined, boxWidth: number, boxHeight: number) {
    if (!image || boxWidth <= 0 || boxHeight <= 0) {
      return;
    }

    const source = image.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const sourceWidth = source?.width || boxWidth;
    const sourceHeight = source?.height || boxHeight;
    const scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight);

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
    const spriteSheetKey = this.getRunnerSpriteSheetKey(lane, false);
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

  private getRunnerSpriteSheetKey(lane: number, fever = this.feverActive) {
    const laneKey = lane === 0 ? "left" : lane === 1 ? "center" : "right";
    return fever ? this.currentThemeAssets.characters.feverSpriteSheets[laneKey] ?? this.currentThemeAssets.characters.spriteSheets[laneKey] : this.currentThemeAssets.characters.spriteSheets[laneKey];
  }

  private updateRunnerSpriteSheets() {
    this.runners.forEach((runner) => {
      if (!(runner.assetImage instanceof Phaser.GameObjects.Sprite)) {
        return;
      }

      const spriteSheetKey = this.getRunnerSpriteSheetKey(runner.lane);
      if (!spriteSheetKey || !this.textures.exists(spriteSheetKey) || runner.assetImage.texture.key === spriteSheetKey) {
        return;
      }

      const frame = Number(runner.assetImage.frame.name);
      runner.assetImage.setTexture(spriteSheetKey, Number.isFinite(frame) ? frame : RUNNER_IDLE_FRAME).setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    });
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
    if (this.feverActive) {
      this.spawnRunnerFeverAfterimage(runner);
    }
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

  private spawnRunnerFeverAfterimage(runner: Runner) {
    if (!(runner.assetImage instanceof Phaser.GameObjects.Sprite)) {
      return;
    }

    const frame = Number(runner.assetImage.frame.name);
    const ghost = this.add
      .sprite(runner.container.x, runner.container.y, runner.assetImage.texture.key, Number.isFinite(frame) ? frame : RUNNER_IDLE_FRAME)
      .setDepth(runner.container.depth - 1)
      .setAlpha(0.28)
      .setTint(this.runnerColor(runner.lane))
      .setAngle(runner.container.angle);
    ghost.setDisplaySize(RUNNER_DISPLAY_WIDTH * runner.container.scaleX, RUNNER_DISPLAY_HEIGHT * runner.container.scaleY);

    this.tweens.add({
      targets: ghost,
      x: ghost.x + (runner.lane - 1) * -18 * this.screenScale,
      y: ghost.y + 10 * this.screenScale,
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 260,
      ease: "Sine.Out",
      onComplete: () => ghost.destroy()
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
    return (this.chart?.approachTime ?? 1.6) * GAME_BALANCE.chartApproachTimeScale;
  }

  private get portraitCharacterScale() {
    return Phaser.Math.Clamp(1 + this.layoutTuning.characterSize * 0.04, 0.68, 1.72);
  }

  private get portraitButtonScale() {
    return Phaser.Math.Clamp(1 + this.layoutTuning.buttonSize * 0.04, 0.72, 1.8);
  }

  private get portraitItemScale() {
    return Phaser.Math.Clamp(1 + this.layoutTuning.itemSize * 0.04, 0.36, 1.4);
  }

  private get effectiveLayoutTuning(): LayoutTuningState {
    return this.isPortrait
      ? {
          ...this.layoutTuning,
          farY: this.layoutTuning.portraitFarY,
          nearW: this.layoutTuning.portraitNearW
        }
      : this.layoutTuning;
  }

  private roundChartTime(value: number) {
    return Math.round(value * 1000) / 1000;
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
    const hitButtons = this.jumpButtons.filter((button) => button.background.getBounds().contains(x, y));
    const targetButton = hitButtons.reduce<JumpButton | undefined>((nearestButton, button) => {
      if (!nearestButton) {
        return button;
      }

      const nearestDistance = Math.abs(x - nearestButton.background.x);
      const buttonDistance = Math.abs(x - button.background.x);
      return buttonDistance < nearestDistance ? button : nearestButton;
    }, undefined);

    if (targetButton) {
      this.jumpRunner(targetButton.lane);
      return;
    }

    this.jumpRunner(this.getPointerLane(x, y));
  }

  private getPointerLane(x: number, y: number) {
    const track = this.getTrackLayout();
    const z = Phaser.Math.Clamp((y - track.topY) / Math.max(1, track.bottomY - track.topY), 0, 1);

    for (let lane = 0; lane < GAME_BALANCE.laneCount; lane += 1) {
      const left = this.getLaneBoundaryPoint(track, lane, z);
      const right = this.getLaneBoundaryPoint(track, lane + 1, z);
      const minX = Math.min(left.x, right.x);
      const maxX = Math.max(left.x, right.x);
      if (x >= minX && x <= maxX) {
        return lane;
      }
    }

    let nearestLane = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let lane = 0; lane < GAME_BALANCE.laneCount; lane += 1) {
      const center = this.getLaneCenterPoint(track, lane, z);
      const distance = Math.abs(x - center.x);
      if (distance < nearestDistance) {
        nearestLane = lane;
        nearestDistance = distance;
      }
    }

    return nearestLane;
  }

  private jumpRunner(lane: number) {
    const runner = this.runners[lane];
    if (!runner) {
      return;
    }

    this.recordLaneInput(lane);
    runner.isJumping = true;
    this.playPerformanceSe(lane);
    this.setRunnerVisualState(lane, "jump");
    this.pulseJumpButton(lane);
    this.spawnJumpEffects(runner);
    this.tweens.killTweensOf(runner.container);
    this.tweens.killTweensOf(runner.body);
    if (runner.assetImage) {
      this.tweens.killTweensOf(runner.assetImage);
    }
    this.layoutPlayers(this.getTrackLayout());
    const baseScaleX = runner.container.scaleX;
    const baseScaleY = runner.container.scaleY;
    runner.container.setAngle(0);
    runner.assetImage?.setDisplaySize(RUNNER_DISPLAY_WIDTH, RUNNER_DISPLAY_HEIGHT);
    this.tweens.add({
      targets: runner.container,
      angle: lane === 0 ? -3 : lane === 2 ? 3 : 0,
      scaleX: baseScaleX * 1.04,
      scaleY: baseScaleY * 0.96,
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
  }

  private pulseJumpButton(lane: number) {
    if (this.isDesktopLandscape || (this.isPortrait && this.gameStarted)) {
      return;
    }

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

  private playMoveSe() {
    if (!this.audioSettings.seEnabled) {
      return;
    }

    this.moveSe?.play();
  }

  private playUiSe() {
    this.playMoveSe();
  }

  private playResultSe() {
    if (!this.audioSettings.seEnabled) {
      return;
    }

    this.itemSe?.play();
  }

  private getBgmVolume() {
    return this.audioSettings.bgmEnabled ? BGM_BASE_VOLUME * this.audioSettings.bgmVolume : 0;
  }

  private getSeVolume(baseVolume: number) {
    return this.audioSettings.seEnabled ? baseVolume * this.audioSettings.seVolume : 0;
  }

  private setSoundVolume(sound: Phaser.Sound.BaseSound | undefined, volume: number) {
    if (sound && "setVolume" in sound && typeof sound.setVolume === "function") {
      sound.setVolume(volume);
    }
  }

  private applyAudioSettings(shouldSave: boolean) {
    this.audioSettings = {
      ...this.audioSettings,
      bgmVolume: Phaser.Math.Clamp(this.audioSettings.bgmVolume, 0, 1),
      seVolume: Phaser.Math.Clamp(this.audioSettings.seVolume, 0, 1)
    };
    this.setSoundVolume(this.bgm, this.getBgmVolume());
    this.setSoundVolume(this.menuBgm, this.getBgmVolume());
    this.setSoundVolume(this.moveSe, this.getSeVolume(MOVE_SE_BASE_VOLUME));
    this.setSoundVolume(this.itemSe, this.getSeVolume(ITEM_SE_BASE_VOLUME));
    this.setSoundVolume(this.redPerformanceSe, this.getSeVolume(PERFORMANCE_SE_BASE_VOLUME));
    this.setSoundVolume(this.yellowPerformanceSe, this.getSeVolume(PERFORMANCE_SE_BASE_VOLUME));
    this.setSoundVolume(this.bluePerformanceSe, this.getSeVolume(PERFORMANCE_SE_BASE_VOLUME));

    if (shouldSave) {
      saveAudioSettings(this.audioSettings);
      gameEvents.emit("audio:settings-changed", {
        bgmEnabled: this.audioSettings.bgmEnabled,
        seEnabled: this.audioSettings.seEnabled
      });
    }

    if (!this.audioSettings.bgmEnabled) {
      this.bgm?.stop();
      this.stopMenuBgm();
      return;
    }

    if (!this.gameStarted && this.menuStep === "result") {
      this.playMenuBgm();
    } else {
      this.stopMenuBgm();
    }
  }

  private createSoundIfLoaded(key: string, config: Phaser.Types.Sound.SoundConfig) {
    if (!this.cache.audio.exists(key)) {
      console.warn(`[BEAT RUNNER] Audio key "${key}" is unavailable; skipping sound effect.`);
      return undefined;
    }

    return this.sound.add(key, config);
  }

  private playPerformanceSe(lane: number) {
    if (!this.audioSettings.seEnabled) {
      return;
    }

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

  private getPlayerLaneCenterPoint(track: TrackLayout, lane: number) {
    const point = this.getLaneCenterPoint(track, lane, GAME_BALANCE.playerZ);
    if (!this.isDesktopLandscape || !this.gameStarted || lane === 1) {
      return point;
    }

    const left = this.getLaneBoundaryPoint(track, lane, GAME_BALANCE.playerZ);
    const right = this.getLaneBoundaryPoint(track, lane + 1, GAME_BALANCE.playerZ);
    const laneWidth = Math.abs(right.x - left.x);
    const direction = lane === 0 ? -1 : 1;

    return {
      x: point.x + direction * laneWidth * 0.22,
      y: point.y
    };
  }

  private getLaneResponsiveScale(track: TrackLayout) {
    if (!this.isDesktopLandscape || !this.gameStarted) {
      return 1;
    }

    const left = this.getLaneBoundaryPoint(track, 0, GAME_BALANCE.playerZ);
    const right = this.getLaneBoundaryPoint(track, 1, GAME_BALANCE.playerZ);
    const laneWidth = Math.abs(right.x - left.x);

    return Phaser.Math.Clamp(laneWidth / 112, 0.54, 0.86);
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
    this.unregisterPageAudioHandlers();
    this.unsubscribeHtmlStart?.();
    this.unsubscribeHtmlStart = undefined;
    this.bgm?.stop();
    this.bgm?.destroy();
    this.bgm = undefined;
    this.menuBgm?.stop();
    this.menuBgm?.destroy();
    this.menuBgm = undefined;
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
    this.input.off("pointermove", this.handlePointerMove);
    this.input.off("pointerup", this.handlePointerUp);
    this.input.off("pointerupoutside", this.handlePointerUp);
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
