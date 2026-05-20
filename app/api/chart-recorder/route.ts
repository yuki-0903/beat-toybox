import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { CHART_RECORDER_ENABLED } from "@/game/config/features";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  if (!CHART_RECORDER_ENABLED) {
    return NextResponse.json({ error: "Chart recorder is disabled" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        chartId?: string;
        difficulty?: string;
        chart?: unknown;
      }
    | null;

  if (!payload || !payload.chart || typeof payload.chart !== "object") {
    return NextResponse.json({ error: "Invalid chart payload" }, { status: 400 });
  }

  const chartId = slugify(payload.chartId ?? "");
  const difficulty = slugify(payload.difficulty ?? "");

  if (!chartId) {
    return NextResponse.json({ error: "Chart ID is required" }, { status: 400 });
  }

  const filename = `beatmap-${chartId}${difficulty ? `-${difficulty}` : ""}.json`;
  const chartsDirectory = path.join(process.cwd(), "public", "assets", "charts");
  const chartFilePath = path.join(chartsDirectory, filename);

  await mkdir(chartsDirectory, { recursive: true });
  await writeFile(chartFilePath, `${JSON.stringify(payload.chart, null, 2)}\n`, "utf8");

  return NextResponse.json({
    filename,
    path: `public/assets/charts/${filename}`
  });
}
