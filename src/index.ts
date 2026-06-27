import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

export interface OrizFleetConfig {
  /** Short slug (e.g. "dynasties", "ragas"). Used in default titles, jsDelivr URL, etc. */
  apiName: string;
  /** Display title (e.g. "Indian Dynasties API"). */
  apiTitle: string;
  /** One-line description for meta/og + hero subtitle. */
  apiDescription: string;
  /** Stats line shown in footer/landing (e.g. "260 records ; CC BY-SA ; MIT"). */
  stats: string;
  /**
   * Tailwind color name (e.g. "emerald", "rose", "indigo") OR a 6-char hex base color.
   * Drives the --color-primary-* CSS custom properties.
   */
  themeColor: string;
  /** GitHub repo "owner/name" (e.g. "oriz-org/dynasties-api"). */
  githubRepo: string;
  /** Sample endpoint path shown on landing (e.g. "/dynasties/mauryan.json"). */
  sampleEndpoint: string;
  /** Sample response JSON shown on landing. */
  sampleResponse: unknown;
  /**
   * Directories at the repo root that should be mirrored into public/ at build time.
   * Each entry is a folder name (no leading slash), e.g. ["dynasties"].
   */
  dataDirs: string[];
  /**
   * JSON files at the repo root that should be mirrored into public/ at build time.
   * e.g. ["index.json", "all.json", "timeline.json"].
   */
  indexFiles: string[];
  /**
   * Optional list of endpoint rows for the /docs table.
   * Each: { path, returns, sample }. If omitted, a sensible default is derived
   * from dataDirs + indexFiles.
   */
  endpoints?: Array<{ path: string; returns: string; sample: string }>;
  /** Optional license blurb. Defaults to "Code: MIT ; Data: CC BY-SA 4.0". */
  licenseBlurb?: string;
}

const VIRTUAL_ID = 'virtual:oriz-fleet-config';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

/**
 * Astro Integration entry point. Drops in:
 *  - / (landing), /docs, /explorer pages
 *  - Tailwind v4 via @tailwindcss/vite (if not already present)
 *  - Pre-build mirror of dataDirs/indexFiles from repo root into public/
 *  - A virtual module `virtual:oriz-fleet-config` exposing the user's config to pages
 */
export default function orizFleet(userConfig: OrizFleetConfig): AstroIntegration {
  // Resolve package-relative entrypoint paths. `import.meta.url` points at the
  // built / installed src/index.ts (or its compiled equivalent).
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pageEntry = (name: string) => path.join(here, 'pages', name);

  return {
    name: '@oriz/api-fleet-template',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig, logger }) => {
        // 1. Inject the 3 shared pages.
        injectRoute({ pattern: '/', entrypoint: pageEntry('index.astro') });
        injectRoute({ pattern: '/docs', entrypoint: pageEntry('docs.astro') });
        injectRoute({ pattern: '/explorer', entrypoint: pageEntry('explorer.astro') });

        // 2. Add a virtual module so pages can `import config from 'virtual:oriz-fleet-config'`.
        const cfgJson = JSON.stringify(userConfig);
        const virtualModulePlugin = {
          name: 'oriz-fleet-config-virtual',
          resolveId(id: string) {
            if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
            return null;
          },
          load(id: string) {
            if (id === RESOLVED_VIRTUAL_ID) {
              return `export default ${cfgJson};`;
            }
            return null;
          },
        };

        // 3. Wire Tailwind v4 if the consumer hasn't already.
        let tailwindPlugin: unknown = null;
        try {
          // Peer dep; resolved against the consuming project's node_modules.
          const tw = require('@tailwindcss/vite');
          const factory = (tw.default || tw) as () => unknown;
          tailwindPlugin = factory();
        } catch (err) {
          logger.warn(
            '@tailwindcss/vite not found as a peer dep — pages will render unstyled. ' +
              'Install it: `npm i -D tailwindcss @tailwindcss/vite`.'
          );
        }

        const plugins = [virtualModulePlugin];
        if (tailwindPlugin) plugins.push(tailwindPlugin as any);

        updateConfig({
          vite: {
            plugins,
          },
        });
      },

      'astro:build:start': ({ logger }) => {
        runPrebuild(logger);
      },

      'astro:server:setup': ({ logger }) => {
        // Same mirror step, so `astro dev` finds the data in public/.
        runPrebuild(logger);
      },
    },
  };

  function runPrebuild(logger: { info: (m: string) => void }) {
    const prebuildPath = path.join(here, 'prebuild.cjs');
    const payload = JSON.stringify({
      dataDirs: userConfig.dataDirs,
      indexFiles: userConfig.indexFiles,
    });
    logger.info('mirroring data dirs + index files into public/');
    const result = spawnSync(process.execPath, [prebuildPath, payload], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    if (result.status !== 0) {
      throw new Error(
        `@oriz/api-fleet-template: prebuild mirror failed (exit ${result.status})`
      );
    }
  }
}

export type { AstroIntegration };
