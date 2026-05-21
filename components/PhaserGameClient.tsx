"use client";

import { useEffect, useRef, useState } from "react";
import type * as Phaser from "phaser";
import { createGame } from "@/game/createGame";

export function PhaserGameClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    let didCancel = false;

    void createGame(containerRef.current).then((game) => {
      if (didCancel) {
        game.destroy(true);
        return;
      }

      gameRef.current = game;
      setIsLoading(false);
    });

    return () => {
      didCancel = true;
      setIsLoading(true);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="game-canvas">
      {isLoading ? <div className="game-loading">LOADING 0%</div> : null}
    </div>
  );
}
