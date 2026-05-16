export interface SongDefinition {
  id: string;
  title: string;
  shortTitle: string;
  bpm: number;
  chartMode?: "generated" | "authored";
  audioKey: string;
  audioFile: string;
  chartKey: string;
  chartFile: string;
}

export const SONGS: SongDefinition[] = [
  {
    id: "tiny-toy-sprint",
    title: "Tiny Toy Sprint",
    shortTitle: "TOY SPRINT",
    bpm: 107.666,
    audioKey: "bgm_tiny_toy_sprint",
    audioFile: "bgm_main.mp3",
    chartKey: "chart_tiny_toy_sprint",
    chartFile: "beatmap-tiny-toy-sprint-v0.json"
  },
  {
    id: "midnight-mini-mart",
    title: "Midnight Mini Mart",
    shortTitle: "MINI MART",
    bpm: 112,
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
    chartMode: "authored",
    audioKey: "bgm_track_1",
    audioFile: "bgm_track_1.mp3",
    chartKey: "chart_track_1",
    chartFile: "beatmap-track-1-hard-items.json"
  },
  {
    id: "track-2",
    title: "Track 2",
    shortTitle: "TRACK 2",
    bpm: 123.05,
    audioKey: "bgm_track_2",
    audioFile: "bgm_track_2.mp3",
    chartKey: "chart_track_2",
    chartFile: "beatmap-track-2-generated.json"
  },
  {
    id: "sushi-techno",
    title: "Sushi Techno",
    shortTitle: "SUSHI TECH",
    bpm: 128,
    audioKey: "bgm_sushi_techno",
    audioFile: "bgm_sushi_techno.wav",
    chartKey: "chart_sushi_techno",
    chartFile: "beatmap-sushi-techno-v0.json"
  }
];
