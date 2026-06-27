#!/usr/bin/env node
/**
 * prebuild.cjs - mirror the repo-root data directories and index files into
 * public/ so Astro includes them in dist/. Keeps the canonical data at repo
 * root for jsDelivr URL stability:
 *   https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/<dataDir>/<slug>.json
 *
 * Hardlinks where possible (faster, atomic), falls back to copyFile.
 *
 * Invoked from src/index.ts as:
 *   node prebuild.cjs '{"dataDirs":["dynasties"],"indexFiles":["index.json"]}'
 *
 * Also supports running directly inside an API repo (npm run prebuild) by
 * reading the same config from package.json#orizFleet or astro.config arg.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');

function parseEntries() {
  const raw = process.argv[2];
  if (raw) {
    try {
      const cfg = JSON.parse(raw);
      const dirs = Array.isArray(cfg.dataDirs) ? cfg.dataDirs : [];
      const files = Array.isArray(cfg.indexFiles) ? cfg.indexFiles : [];
      return [...dirs, ...files];
    } catch (err) {
      console.error('[prebuild] failed to parse config arg:', err.message);
      process.exit(1);
    }
  }
  // Fallback: try package.json#orizFleet.
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const cfg = pkg.orizFleet || {};
    const dirs = Array.isArray(cfg.dataDirs) ? cfg.dataDirs : [];
    const files = Array.isArray(cfg.indexFiles) ? cfg.indexFiles : [];
    return [...dirs, ...files];
  } catch {
    return [];
  }
}

function mirror(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      mirror(path.join(src, name), path.join(dst, name));
    }
    return;
  }
  try {
    fs.unlinkSync(dst);
  } catch {}
  try {
    fs.linkSync(src, dst);
  } catch {
    fs.copyFileSync(src, dst);
  }
}

const ENTRIES = parseEntries();
if (ENTRIES.length === 0) {
  console.warn('[prebuild] no dataDirs/indexFiles configured - skipping');
  process.exit(0);
}

fs.mkdirSync(PUB, { recursive: true });

for (const entry of ENTRIES) {
  const src = path.join(ROOT, entry);
  const dst = path.join(PUB, entry);
  if (!fs.existsSync(src)) {
    console.warn(`[prebuild] missing: ${src} - skipping`);
    continue;
  }
  if (fs.existsSync(dst) && fs.statSync(dst).isDirectory()) {
    fs.rmSync(dst, { recursive: true, force: true });
  }
  mirror(src, dst);
  console.log(`[prebuild] mirrored ${entry} -> public/${entry}`);
}

console.log('[prebuild] done');
