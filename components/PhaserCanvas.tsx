"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, useEffect, useState } from "react";
import { gameEvents } from "@/game/systems/GameEvents";

const PhaserGame = dynamic(
  async () => {
    const { PhaserGameClient } = await import("@/components/PhaserGameClient");
    return PhaserGameClient;
  },
  {
    ssr: false,
    loading: () => <div className="game-canvas" />
  }
);

export function PhaserCanvas() {
  const [isReady, setIsReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isStartPressed, setIsStartPressed] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const startScreenStyle = {
    "--start-bg-pc": `url("${basePath}/assets/themes/tiny_toy_sprint/background/tinytoy_bg_start_pc_tiny_beat_band_01.webp")`,
    "--start-bg-sp": `url("${basePath}/assets/themes/tiny_toy_sprint/background/tinytoy_bg_start_sp_tiny_beat_band_01.webp")`,
    "--start-button": `url("${basePath}/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_button_primary_red_01.webp")`,
    "--start-button-pressed": `url("${basePath}/assets/themes/tiny_toy_sprint/ui/parts/tinytoy_ui_button_primary_red_pressed_01.webp")`
  } as CSSProperties;

  useEffect(() => {
    const offProgress = gameEvents.on("assets:progress", (payload) => {
      setLoadingProgress(Math.round(Math.max(0, Math.min(1, payload.progress)) * 100));
    });
    const offSceneReady = gameEvents.on("scene:ready", (payload) => {
      if (payload.sceneKey === "MainScene") {
        setLoadingProgress(100);
        setIsReady(true);
      }
    });

    return () => {
      offProgress();
      offSceneReady();
    };
  }, []);

  const startGame = () => {
    if (!isReady || isStartPressed) {
      return;
    }

    setIsStartPressed(true);
    window.setTimeout(() => {
      setHasStarted(true);
      gameEvents.emit("ui:start");
    }, 120);
  };

  return (
    <>
      <PhaserGame />
      {!hasStarted ? (
        <div className="html-start-screen" aria-live="polite" style={startScreenStyle}>
          <div className="html-start-screen__content">
            {isReady ? (
              <button
                className={`html-start-screen__button${isStartPressed ? " html-start-screen__button--pressed" : ""}`}
                type="button"
                aria-label="Start"
                disabled={isStartPressed}
                onClick={startGame}
              />
            ) : (
              <div className="html-start-screen__loading">LOADING {loadingProgress}%</div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
