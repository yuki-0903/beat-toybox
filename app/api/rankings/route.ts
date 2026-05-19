import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

const rankingFilePath = path.join(process.cwd(), "data", "rankings.json");
const maxRankingCount = 50;

export async function GET() {
  const rankings = await readRankings();
  return NextResponse.json({ rankings });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const entry = normalizeRankingEntry(payload);

  if (!entry) {
    return NextResponse.json({ error: "Invalid ranking entry" }, { status: 400 });
  }

  const rankings = [...(await readRankings()), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRankingCount);

  await writeRankings(rankings);

  return NextResponse.json({ rankings });
}

async function readRankings() {
  try {
    const rawRankings = await readFile(rankingFilePath, "utf8");
    const parsedRankings = JSON.parse(rawRankings) as RankingEntry[];

    return Array.isArray(parsedRankings)
      ? parsedRankings
          .map(normalizeRankingEntry)
          .filter((entry): entry is RankingEntry => Boolean(entry))
          .sort((a, b) => b.score - a.score)
          .slice(0, maxRankingCount)
      : [];
  } catch {
    return [];
  }
}

async function writeRankings(rankings: RankingEntry[]) {
  await mkdir(path.dirname(rankingFilePath), { recursive: true });
  await writeFile(rankingFilePath, `${JSON.stringify(rankings, null, 2)}\n`, "utf8");
}

function normalizeRankingEntry(value: unknown): RankingEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<RankingEntry>;
  const score = toSafeInteger(entry.score);

  if (score < 0) {
    return null;
  }

  return {
    playerName: normalizeText(entry.playerName, "PLAYER", 10),
    song: normalizeText(entry.song, "UNKNOWN", 24),
    difficulty: normalizeText(entry.difficulty, "NORMAL", 12),
    score,
    avoidCount: toSafeInteger(entry.avoidCount),
    maxCombo: toSafeInteger(entry.maxCombo),
    missCount: toSafeInteger(entry.missCount),
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString()
  };
}

function normalizeText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength) || fallback;
}

function toSafeInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
