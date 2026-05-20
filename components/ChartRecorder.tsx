"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_ASSET_BASE } from "@/game/config/assets";
import { SONGS } from "@/game/config/songs";

type Lane = 0 | 1 | 2;

interface RecordedTap {
  id: string;
  rawTime: number;
  lane: Lane;
}

const laneLabels = ["Red", "Yellow", "Blue"] as const;
const laneKeys = ["A", "S", "D"] as const;
const laneTypes = ["music_note_red", "music_note_yellow", "music_note_blue"] as const;

const quantizeOptions = [
  { label: "Off", value: 0 },
  { label: "1/4", value: 4 },
  { label: "1/8", value: 8 },
  { label: "1/16", value: 16 }
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roundTime(value: number) {
  return Math.round(value * 1000) / 1000;
}

function quantizeTime(time: number, bpm: number, division: number) {
  if (division <= 0 || bpm <= 0) {
    return time;
  }

  const beatSeconds = 60 / bpm;
  const stepSeconds = beatSeconds * (4 / division);
  return Math.round(time / stepSeconds) * stepSeconds;
}

export function ChartRecorder() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [sourceMode, setSourceMode] = useState<"song" | "file">("song");
  const [songId, setSongId] = useState(SONGS[0]?.id ?? "");
  const [audioSrc, setAudioSrc] = useState("");
  const [title, setTitle] = useState(SONGS[0]?.title ?? "New Track");
  const [chartId, setChartId] = useState(SONGS[0]?.id ?? "new-track");
  const [bpm, setBpm] = useState(SONGS[0]?.bpm ?? 120);
  const [difficulty, setDifficulty] = useState("hard");
  const [approachTime, setApproachTime] = useState(1.6);
  const [offsetSeconds, setOffsetSeconds] = useState(-0.08);
  const [quantizeDivision, setQuantizeDivision] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState(false);
  const [taps, setTaps] = useState<RecordedTap[]>([]);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const selectedSong = useMemo(() => SONGS.find((song) => song.id === songId) ?? SONGS[0], [songId]);

  useEffect(() => {
    if (sourceMode !== "song" || !selectedSong) {
      return;
    }

    setTitle(selectedSong.title);
    setChartId(selectedSong.id);
    setBpm(selectedSong.bpm);
    setAudioSrc(`${AUDIO_ASSET_BASE}/${selectedSong.audioFile}`);
  }, [selectedSong, sourceMode]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const adjustedTaps = useMemo(() => {
    return taps
      .map((tap) => {
        const adjustedTime = Math.max(0, quantizeTime(tap.rawTime + offsetSeconds, bpm, quantizeDivision));
        return {
          ...tap,
          time: roundTime(adjustedTime)
        };
      })
      .sort((a, b) => a.time - b.time || a.lane - b.lane);
  }, [bpm, offsetSeconds, quantizeDivision, taps]);

  const chart = useMemo(() => {
    const safeTitle = title.trim() || "New Track";
    const safeId = slugify(chartId || safeTitle) || "new-track";
    return {
      id: safeId,
      title: safeTitle,
      bpm,
      lanes: 3,
      duration: roundTime(duration || audioRef.current?.duration || 0),
      approachTime,
      chartMode: "performance",
      difficulty,
      globalOffsetSeconds: offsetSeconds,
      notes: "Recorded with the in-browser chart recorder.",
      obstacles: adjustedTaps.map((tap) => ({
        time: tap.time,
        lane: tap.lane,
        type: laneTypes[tap.lane],
        pattern: "single",
        energy: 0.55
      })),
      items: []
    };
  }, [adjustedTaps, approachTime, bpm, chartId, difficulty, duration, offsetSeconds, title]);

  const chartJson = useMemo(() => {
    return `${JSON.stringify(chart, null, 2)}\n`;
  }, [chart]);

  function recordTap(lane: Lane) {
    const audio = audioRef.current;
    if (!audio || !recording) {
      return;
    }

    setTaps((currentTaps) => [
      ...currentTaps,
      {
        id: `${Date.now()}-${lane}-${currentTaps.length}`,
        rawTime: roundTime(audio.currentTime),
        lane
      }
    ]);
  }

  function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setSourceMode("file");
    setAudioSrc(objectUrl);
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    setChartId(slugify(file.name.replace(/\.[^.]+$/, "")) || "new-track");
    setTaps([]);
    setDuration(0);
  }

  async function startRecording() {
    const audio = audioRef.current;
    if (!audio || !audioSrc) {
      return;
    }

    setCopied(false);
    setSaveStatus("");
    setRecording(true);
    await audio.play();
  }

  function stopRecording() {
    setRecording(false);
    audioRef.current?.pause();
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    setRecording(false);
  }

  function undoLastTap() {
    setTaps((currentTaps) => currentTaps.slice(0, -1));
  }

  async function copyJson() {
    await navigator.clipboard.writeText(chartJson);
    setCopied(true);
  }

  function downloadJson() {
    const filename = `beatmap-${slugify(chartId || title) || "new-track"}-${difficulty}.json`;
    const blob = new Blob([chartJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveJson() {
    setSaveStatus("Saving...");
    const response = await fetch("/api/chart-recorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chartId: chart.id,
        difficulty,
        chart
      })
    });

    const payload = (await response.json().catch(() => null)) as { path?: string; error?: string } | null;
    if (!response.ok) {
      setSaveStatus(payload?.error ?? "Save failed");
      return;
    }

    setSaveStatus(payload?.path ?? "Saved");
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") {
        event.preventDefault();
        recordTap(0);
      }

      if (key === "s" || key === "arrowdown" || key === " ") {
        event.preventDefault();
        recordTap(1);
      }

      if (key === "d" || key === "arrowright") {
        event.preventDefault();
        recordTap(2);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main className="chart-recorder">
      <header className="chart-recorder__header">
        <div>
          <p className="chart-recorder__eyebrow">Beat Toybox</p>
          <h1>Chart Recorder</h1>
        </div>
        <a className="chart-recorder__game-link" href="/?record=1">
          Game REC
        </a>
      </header>

      <section className="chart-recorder__layout">
        <div className="recorder-panel recorder-panel--controls">
          <div className="recorder-grid">
            <label>
              Source
              <select
                value={sourceMode === "song" ? songId : "file"}
                onChange={(event) => {
                  if (event.target.value === "file") {
                    setSourceMode("file");
                    return;
                  }

                  setSourceMode("song");
                  setSongId(event.target.value);
                  setTaps([]);
                  setDuration(0);
                }}
              >
                {SONGS.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title}
                  </option>
                ))}
                <option value="file">Local audio file</option>
              </select>
            </label>

            <label>
              Audio file
              <input type="file" accept="audio/*" onChange={(event) => handleFileChange(event.target.files?.[0])} />
            </label>

            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label>
              Chart ID
              <input value={chartId} onChange={(event) => setChartId(event.target.value)} />
            </label>

            <label>
              BPM
              <input
                min="1"
                step="0.001"
                type="number"
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </label>

            <label>
              Difficulty
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option value="easy">easy</option>
                <option value="normal">normal</option>
                <option value="hard">hard</option>
              </select>
            </label>

            <label>
              Offset seconds
              <input
                step="0.01"
                type="number"
                value={offsetSeconds}
                onChange={(event) => setOffsetSeconds(Number(event.target.value))}
              />
            </label>

            <label>
              Quantize
              <select value={quantizeDivision} onChange={(event) => setQuantizeDivision(Number(event.target.value))}>
                {quantizeOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Approach
              <input
                min="0.4"
                step="0.1"
                type="number"
                value={approachTime}
                onChange={(event) => setApproachTime(Number(event.target.value))}
              />
            </label>
          </div>

          <audio
            ref={audioRef}
            className="chart-recorder__audio"
            controls
            src={audioSrc}
            onLoadedMetadata={(event) => setDuration(roundTime(event.currentTarget.duration || 0))}
            onEnded={() => setRecording(false)}
          />

          <div className="transport">
            <button className="transport__record" disabled={!audioSrc || recording} onClick={startRecording}>
              Record
            </button>
            <button disabled={!recording} onClick={stopRecording}>
              Stop
            </button>
            <button disabled={!audioSrc} onClick={restart}>
              Reset
            </button>
            <button disabled={taps.length === 0} onClick={undoLastTap}>
              Undo
            </button>
            <button disabled={taps.length === 0} onClick={() => setTaps([])}>
              Clear
            </button>
          </div>

          <div className="lane-pads" aria-label="record lanes">
            {[0, 1, 2].map((lane) => (
              <button
                className={`lane-pad lane-pad--${lane}`}
                disabled={!recording}
                key={lane}
                onPointerDown={() => recordTap(lane as Lane)}
              >
                <span>{laneLabels[lane]}</span>
                <strong>{laneKeys[lane]}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="recorder-panel recorder-panel--timeline">
          <div className="recorder-stats">
            <div>
              <span>Taps</span>
              <strong>{taps.length}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{duration ? `${duration.toFixed(1)}s` : "--"}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{recording ? "REC" : "Idle"}</strong>
            </div>
          </div>

          <div className="tap-list">
            {adjustedTaps.slice(-18).map((tap, index) => (
              <div className="tap-row" key={tap.id}>
                <span>{String(adjustedTaps.length - adjustedTaps.slice(-18).length + index + 1).padStart(3, "0")}</span>
                <strong>{tap.time.toFixed(3)}s</strong>
                <em>{laneLabels[tap.lane]}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="recorder-panel recorder-panel--json">
          <div className="json-actions">
            <button disabled={taps.length === 0} onClick={saveJson}>
              Save File
            </button>
            <button disabled={taps.length === 0} onClick={copyJson}>
              {copied ? "Copied" : "Copy JSON"}
            </button>
            <button disabled={taps.length === 0} onClick={downloadJson}>
              Download
            </button>
            {saveStatus ? <span>{saveStatus}</span> : null}
          </div>
          <textarea readOnly value={chartJson} />
        </div>
      </section>
    </main>
  );
}
