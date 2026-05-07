import { existsSync, mkdirSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import type { PassiveTreeRenderAssets } from "../src/domain/graph/PassiveTreeRenderAssets";
import type { PassiveTreeDto } from "../src/infrastructure/passiveTree/dto/passiveTree/PassiveSkillTree.dto";
import { mapRenderAssetsFromJson } from "../src/infrastructure/passiveTree/mapping/mappers/mapRenderAssetsFromJson";

// ─── Config ───────────────────────────────────────────────────────────────────

const TREE_JSON_PATH = "public/data/passiveSkillTree.json";
const OUTPUT_DIR = "public/tree-assets";
const CONCURRENCY = 8;
const POE_CDN_DOMAIN = "https://web.poecdn.com";
const FORCE = process.argv.includes("--force");
const CLEAN = process.argv.includes("--clean");

function collectAssetUrls(raw: PassiveTreeDto): Map<string, string> {
  const mapped: PassiveTreeRenderAssets = mapRenderAssetsFromJson(raw);
  // Map<remoteUrl, relPath>  — relPath is the local path under OUTPUT_DIR
  const map = new Map<string, string>();

  for (const sheets of Object.values(mapped.sprites)) {
    if (!sheets) continue;
    for (const sheet of Object.values(sheets)) {
      map.set(POE_CDN_DOMAIN + sheet.filename, sheet.filename.split("?")[0]!);
    }
  }

  return map;
}

// ─── Download helpers ─────────────────────────────────────────────────────────

async function download(url: string, dest: string): Promise<void> {
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);

  await Bun.write(dest, await res.arrayBuffer());
}

async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) await fn(queue.shift()!);
    }),
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dto = (await Bun.file(TREE_JSON_PATH).json()) as PassiveTreeDto;

  const urls = collectAssetUrls(dto);
  console.log(`🔍  ${urls.size} unique assets found`);

  // ── Download phase ──────────────────────────────────────────────────────────
  const toDownload = [...urls.entries()]
    .filter(([, relPath]) => FORCE || !existsSync(join(OUTPUT_DIR, relPath)))
    .map(([url, relPath]) => ({ url, dest: join(OUTPUT_DIR, relPath) }));

  if (toDownload.length === 0) {
    console.log("✅  Nothing to download. Pass --force to re-download everything.");
  } else {
    console.log(`⬇️   Downloading ${toDownload.length} files (concurrency=${CONCURRENCY})...`);
    let done = 0;
    await pool(toDownload, CONCURRENCY, async ({ url, dest }) => {
      await download(url, dest);
      done++;
      if (done % 20 === 0 || done === toDownload.length)
        process.stdout.write(`\r    ${done}/${toDownload.length}`);
    });
    console.log();
  }

  // ── Clean phase (--clean removes stale files not in current JSON) ───────────
  if (CLEAN) {
    const knownPaths = new Set([...urls.values()].map((p) => join(OUTPUT_DIR, p)));
    const { globSync } = await import("glob"); // bun ships glob
    let removed = 0;
    for (const f of globSync(`${OUTPUT_DIR}/**/*.png`)) {
      if (!knownPaths.has(f)) {
        unlinkSync(f);
        removed++;
      }
    }
    if (removed > 0) console.log(`🗑️   Removed ${removed} stale file(s)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
