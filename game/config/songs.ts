import type { ThemeId } from "@/game/config/themes";

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
  thumbnailKey?: string;
  thumbnailFile?: string;
}

const ALL_SONGS: SongDefinition[] = [
  {
    id: "tiny-toy-sprint",
    title: "Tiny Toy Sprint",
    shortTitle: "TOY SPRINT",
    bpm: 107.666,
    themeId: "tiny-toy-sprint",
    audioKey: "bgm_tiny_toy_sprint",
    audioFile: "bgm_main.mp3",
    chartKey: "chart_tiny_toy_sprint",
    chartFile: "beatmap-tiny-toy-sprint-v0.json"
  },
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
    thumbnailKey: "thumbnail_coin_pop_parade",
    thumbnailFile: "coin-pop-parade-thumbnail.png"
  },
  {
    id: "midnight-mini-mart",
    title: "Midnight Mini Mart",
    shortTitle: "MINI MART",
    bpm: 112,
    themeId: "jazz-night-lounge",
    audioKey: "bgm_midnight_mini_mart",
    audioFile: "bgm_midnight_mini_mart.wav",
    chartKey: "chart_midnight_mini_mart",
    chartFile: "beatmap-midnight-mini-mart-v0.json"
  },
  {
    id: "track-1",
    title: "Track 1",
    shortTitle: "TRACK 1",
    bpm: 128,
    themeId: "techno-industrial",
    chartMode: "authored",
    audioKey: "bgm_track_1",
    audioFile: "bgm_track_1.mp3",
    chartKey: "chart_track_1",
    chartFile: "beatmap-track-1-hard-items.json",
    thumbnailKey: "thumbnail_dummy_track_1",
    thumbnailFile: "song-thumbnail-placeholder-gray.png"
  },
  {
    id: "track-2",
    title: "Track 2",
    shortTitle: "TRACK 2",
    bpm: 123.05,
    themeId: "rock-garage",
    audioKey: "bgm_track_2",
    audioFile: "bgm_track_2.mp3",
    chartKey: "chart_track_2",
    chartFile: "beatmap-track-2-generated.json",
    thumbnailKey: "thumbnail_dummy_track_2",
    thumbnailFile: "song-thumbnail-placeholder-gray.png"
  },
  {
    id: "sushi-techno",
    title: "Sushi Techno",
    shortTitle: "SUSHI TECH",
    bpm: 128,
    themeId: "japanese-festival",
    audioKey: "bgm_sushi_techno",
    audioFile: "bgm_sushi_techno.wav",
    chartKey: "chart_sushi_techno",
    chartFile: "beatmap-sushi-techno-v0.json"
  }
];

export const SONGS: SongDefinition[] = ALL_SONGS.filter((song) => ["coin-pop-parade", "track-1", "track-2"].includes(song.id));
