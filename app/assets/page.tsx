import fs from "node:fs";
import path from "node:path";

import Image from "next/image";

import { getTinyToyAssetManifest } from "@/game/config/themeAssets";

type AssetStatus = {
  key: string;
  category: string;
  priority: "P0" | "P1" | "P2";
  placeholderPath: string;
  productionPath?: string;
  placeholderReady: boolean;
  productionReady: boolean;
};

const priorityOrder = ["P0", "P1", "P2"] as const;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function AssetsPage() {
  const assets = getTinyToyAssetManifest().map((asset): AssetStatus => {
    const placeholderReady = publicAssetExists(asset.placeholderPath);
    const productionReady = asset.productionPath ? publicAssetExists(asset.productionPath) : false;

    return {
      key: asset.key,
      category: asset.category,
      priority: asset.priority,
      placeholderPath: asset.placeholderPath,
      productionPath: asset.productionPath,
      placeholderReady,
      productionReady
    };
  });

  const productionTargets = assets.filter((asset) => asset.productionPath);
  const productionReady = productionTargets.filter((asset) => asset.productionReady).length;
  const placeholderReady = assets.filter((asset) => asset.placeholderReady).length;

  return (
    <main className="asset-dashboard">
      <header className="asset-dashboard__hero">
        <div>
          <p className="asset-dashboard__eyebrow">Tiny Toy Sprint</p>
          <h1>Asset Readiness</h1>
          <p className="asset-dashboard__lead">
            生成した本番アセットを置いたら、この画面で差し替え状況を確認できます。
          </p>
        </div>
        <a className="asset-dashboard__game-link" href={`${basePath || "/"}`}>
          Game
        </a>
      </header>

      <section className="asset-dashboard__summary" aria-label="Asset summary">
        <SummaryStat label="Placeholder" value={`${placeholderReady}/${assets.length}`} tone="mint" />
        <SummaryStat label="Production Asset" value={`${productionReady}/${productionTargets.length}`} tone="orange" />
        {priorityOrder.map((priority) => {
          const targets = productionTargets.filter((asset) => asset.priority === priority);
          const ready = targets.filter((asset) => asset.productionReady).length;
          return <SummaryStat key={priority} label={priority} value={`${ready}/${targets.length}`} tone={priorityTone(priority)} />;
        })}
      </section>

      <section className="asset-dashboard__sections">
        {priorityOrder.map((priority) => {
          const targets = productionTargets.filter((asset) => asset.priority === priority);
          return (
            <section key={priority} className="asset-dashboard__priority" aria-label={`${priority} assets`}>
              <div className="asset-dashboard__section-head">
                <h2>{priority}</h2>
                <span>{targets.filter((asset) => asset.productionReady).length}/{targets.length}</span>
              </div>
              <div className="asset-grid">
                {targets.map((asset) => (
                  <article className="asset-card" key={asset.key}>
                    <div className="asset-card__preview">
                      <Image
                        src={asset.productionReady ? asset.productionPath ?? asset.placeholderPath : asset.placeholderPath}
                        alt=""
                        width={128}
                        height={128}
                        unoptimized
                      />
                    </div>
                    <div className="asset-card__body">
                      <div className="asset-card__meta">
                        <span>{asset.category}</span>
                        <strong className={asset.productionReady ? "is-ready" : "is-todo"}>
                          {asset.productionReady ? "READY" : "TODO"}
                        </strong>
                      </div>
                      <h3>{asset.key}</h3>
                      <p>{asset.productionPath}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`asset-stat asset-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function priorityTone(priority: "P0" | "P1" | "P2") {
  if (priority === "P0") {
    return "red";
  }

  if (priority === "P1") {
    return "blue";
  }

  return "cream";
}

function publicAssetExists(assetPath: string) {
  const localPath = assetPath.replace(/^\//, "");
  return fs.existsSync(path.join(process.cwd(), "public", localPath.replace(/^assets\//, "assets/")));
}
