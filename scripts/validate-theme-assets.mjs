import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const themeAssetsPath = path.join(rootDir, "game/config/themeAssets.ts");
const source = readFileSync(themeAssetsPath, "utf8");
const outputMode = process.argv.includes("--markdown") ? "markdown" : "validate";
const arrayPattern = /const tinyToyFiles: ThemeAssetFile\[] = \[([\s\S]*?)\];/;
const fieldPattern = (fieldName) => new RegExp(`${fieldName}:\\s*"([^"]+)"`);
const keyCounts = new Map();
const missingRequiredFiles = [];
const missingProductionFiles = [];
const assets = [];
let checkedCount = 0;
let productionCount = 0;
const tinyToyFilesSource = source.match(arrayPattern)?.[1] ?? "";

for (const match of tinyToyFilesSource.matchAll(/\{([^}]+)\}/g)) {
  const entrySource = match[1];
  const key = entrySource.match(fieldPattern("key"))?.[1];
  const category = entrySource.match(fieldPattern("category"))?.[1];
  const placeholderFile = entrySource.match(fieldPattern("placeholderFile"))?.[1];
  const productionFile = entrySource.match(fieldPattern("productionFile"))?.[1];
  const priority = entrySource.match(fieldPattern("priority"))?.[1] ?? "P2";

  if (!key || !category || !placeholderFile) {
    continue;
  }

  const placeholderPath = path.join(rootDir, "public/assets/themes/tiny_toy_sprint", category, placeholderFile);
  const productionPath = productionFile
    ? path.join(rootDir, "public/assets/themes/tiny_toy_sprint", category, productionFile)
    : undefined;
  const placeholderExists = existsSync(placeholderPath);
  const productionExists = productionPath ? existsSync(productionPath) : false;

  checkedCount += 1;
  keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);

  assets.push({
    key,
    category,
    placeholderPath: path.relative(rootDir, placeholderPath),
    placeholderExists,
    productionPath: productionPath ? path.relative(rootDir, productionPath) : "",
    productionExists,
    hasProductionTarget: Boolean(productionFile),
    priority
  });

  if (!placeholderExists) {
    missingRequiredFiles.push({ key, path: path.relative(rootDir, placeholderPath) });
  }

  if (productionFile) {
    productionCount += 1;
    if (!productionExists) {
      missingProductionFiles.push({ key, path: path.relative(rootDir, productionPath) });
    }
  }
}

const duplicateKeys = Array.from(keyCounts.entries())
  .filter(([, count]) => count > 1)
  .map(([key]) => key);

if (checkedCount === 0) {
  console.error("No theme asset entries found in game/config/themeAssets.ts");
  process.exit(1);
}

if (outputMode === "markdown") {
  printMarkdownReport();
  process.exit(0);
}

if (duplicateKeys.length > 0 || missingRequiredFiles.length > 0) {
  duplicateKeys.forEach((key) => {
    console.error(`Duplicate theme asset key: ${key}`);
  });

  missingRequiredFiles.forEach((asset) => {
    console.error(`Missing required placeholder asset for ${asset.key}: ${asset.path}`);
  });

  process.exit(1);
}

console.log(`Theme placeholders OK: ${checkedCount} files checked.`);

if (productionCount > 0) {
  const readyCount = productionCount - missingProductionFiles.length;
  console.log(`Production PNGs: ${readyCount}/${productionCount} present.`);
}

if (missingProductionFiles.length > 0) {
  console.log("Missing optional production PNGs:");
  missingProductionFiles.forEach((asset) => {
    console.log(`- ${asset.key}: ${asset.path}`);
  });
}

function printMarkdownReport() {
  const readyCount = productionCount - missingProductionFiles.length;

  console.log("# Tiny Toy Sprint Asset Readiness");
  console.log("");
  console.log(`Generated from \`game/config/themeAssets.ts\`.`);
  console.log("");
  console.log("## Summary");
  console.log("");
  console.log(`- Placeholder assets: ${checkedCount - missingRequiredFiles.length}/${checkedCount} ready`);
  console.log(`- Production PNG targets: ${readyCount}/${productionCount} ready`);
  console.log(`- Duplicate keys: ${duplicateKeys.length}`);
  console.log("");
  console.log("## Priority Summary");
  console.log("");
  console.log("| Priority | Ready | Total |");
  console.log("|---|---:|---:|");
  ["P0", "P1", "P2"].forEach((priority) => {
    const priorityAssets = assets.filter((asset) => asset.hasProductionTarget && asset.priority === priority);
    const priorityReady = priorityAssets.filter((asset) => asset.productionExists).length;
    console.log(`| ${priority} | ${priorityReady} | ${priorityAssets.length} |`);
  });
  console.log("");
  console.log("## Production Checklist");
  console.log("");
  console.log("| Status | Priority | Category | Key | Production path | Placeholder |");
  console.log("|---|---|---|---|---|---|");

  assets
    .filter((asset) => asset.hasProductionTarget)
    .sort((a, b) => `${a.priority}-${a.category}-${a.key}`.localeCompare(`${b.priority}-${b.category}-${b.key}`))
    .forEach((asset) => {
      const status = asset.productionExists ? "READY" : "TODO";
      const placeholder = asset.placeholderExists ? "OK" : "MISSING";
      console.log(
        `| ${status} | ${asset.priority} | ${asset.category} | \`${asset.key}\` | \`${asset.productionPath}\` | ${placeholder} |`
      );
    });

  console.log("");
  console.log("## Placeholder Coverage");
  console.log("");
  console.log("| Status | Category | Key | Placeholder path |");
  console.log("|---|---|---|---|");

  assets.forEach((asset) => {
    const status = asset.placeholderExists ? "OK" : "MISSING";
    console.log(`| ${status} | ${asset.category} | \`${asset.key}\` | \`${asset.placeholderPath}\` |`);
  });
}
