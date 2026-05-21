import type { ThemeId } from "@/game/config/themes";

export type SongDifficulty = "easy" | "normal" | "hard";

export interface SongDefinition {
  id: string;
  title: string;
  shortTitle: string;
  bpm: number;
  themeId: ThemeId;
  chartMode?: "generated" | "authored";
  audioKey: string;
  audioFile: string;
  chartKey: string;
  chartFile: string;
  chartFiles?: Partial<Record<SongDifficulty, string>>;
  preserveAuthoredChart?: boolean;
  thumbnailKey?: string;
  thumbnailFile?: string;
}

const ALL_SONGS: SongDefinition[] = [
  {
    id: "coin-pop-parade",
    title: "Coin Pop Parade",
    shortTitle: "COIN POP",
    bpm: 152,
    themeId: "dnb-neon-city",
    chartMode: "authored",
    audioKey: "bgm_coin_pop_parade",
    audioFile: "coin-pop-parade.mp3",
    chartKey: "chart_coin_pop_parade",
    chartFile: "beatmap-coin-pop-parade-hard.json",
    chartFiles: {
      easy: "beatmap-coin-pop-parade-easy.json",
      normal: "beatmap-coin-pop-parade-normal.json",
      hard: "beatmap-coin-pop-parade-hard.json"
    },
    preserveAuthoredChart: true,
    thumbnailKey: "thumbnail_coin_pop_parade",
    thumbnailFile: "coin-pop-parade-thumbnail.webp"
  },
  {
    id: "tiny-parade-loop",
    title: "Tiny Parade Loop",
    shortTitle: "TINY PARADE",
    bpm: 120,
    themeId: "dnb-neon-city",
    chartMode: "authored",
    audioKey: "bgm_tiny_parade_loop",
    audioFile: "tiny-parade-loop.mp3",
    chartKey: "chart_tiny_parade_loop",
    chartFile: "beatmap-tiny-parade-loop-played-normal.json",
    chartFiles: {
      easy: "beatmap-tiny-parade-loop-played-easy.json",
      normal: "beatmap-tiny-parade-loop-played-normal.json",
      hard: "beatmap-tiny-parade-loop-played-hard.json"
    },
    preserveAuthoredChart: true,
    thumbnailKey: "thumbnail_tiny_parade_loop",
    thumbnailFile: "tiny-parade-loop-thumbnail.webp"
  },
  {
    id: "sugar-tap-loop",
    title: "Sugar Tap Loop",
    shortTitle: "SUGAR TAP",
    bpm: 120,
    themeId: "dnb-neon-city",
    chartMode: "authored",
    audioKey: "bgm_sugar_tap_loop",
    audioFile: "sugar-tap-loop.mp3",
    chartKey: "chart_sugar_tap_loop",
    chartFile: "beatmap-sugar-tap-loop-played-normal.json",
    chartFiles: {
      easy: "beatmap-sugar-tap-loop-played-easy.json",
      normal: "beatmap-sugar-tap-loop-played-normal.json",
      hard: "beatmap-sugar-tap-loop-played-hard.json"
    },
    preserveAuthoredChart: true,
    thumbnailKey: "thumbnail_sugar_tap_loop",
    thumbnailFile: "sugar-tap-loop-thumbnail.webp"
  },
  {
    id: "candy-gear-loop",
    title: "Candy Gear Loop",
    shortTitle: "CANDY GEAR",
    bpm: 128,
    themeId: "techno-industrial",
    chartMode: "authored",
    audioKey: "bgm_candy_gear_loop",
    audioFile: "candy-gear-loop.mp3",
    chartKey: "chart_candy_gear_loop",
    chartFile: "beatmap-candy-gear-loop-normal.json",
    chartFiles: {
      easy: "beatmap-candy-gear-loop-easy.json",
      normal: "beatmap-candy-gear-loop-normal.json",
      hard: "beatmap-candy-gear-loop-hard.json"
    },
    preserveAuthoredChart: true,
    thumbnailKey: "thumbnail_candy_gear_loop",
    thumbnailFile: "candy-gear-loop-thumbnail.webp"
  }
];

export const SONGS: SongDefinition[] = ALL_SONGS.filter((song) =>
  ["coin-pop-parade", "tiny-parade-loop", "sugar-tap-loop", "candy-gear-loop"].includes(song.id)
);
