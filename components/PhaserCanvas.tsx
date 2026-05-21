"use client";

import dynamic from "next/dynamic";

const PhaserGame = dynamic(
  async () => {
    const { PhaserGameClient } = await import("@/components/PhaserGameClient");
    return PhaserGameClient;
  },
  {
    ssr: false,
    loading: () => (
      <div className="game-canvas">
        <div className="game-loading">LOADING 0%</div>
      </div>
    )
  }
);

export function PhaserCanvas() {
  return <PhaserGame />;
}
