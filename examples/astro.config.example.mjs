// @ts-check
import { defineConfig } from 'astro/config';
import orizFleet from '@oriz/api-fleet-template';

// Example astro.config.mjs for a fleet API repo that uses this integration.
//
// What the consuming repo provides:
//   - <root>/<dataDir>/*.json  (one file per record)
//   - <root>/<indexFile>       (top-level JSON index files)
//   - astro.config.mjs (this file)
//   - package.json with astro + tailwindcss + @tailwindcss/vite + @oriz/api-fleet-template
//
// What the integration provides:
//   - / landing
//   - /docs reference
//   - /explorer interactive demo
//   - Tailwind v4 wiring
//   - Prebuild step that mirrors <dataDir>/ + <indexFile> from repo root into public/

export default defineConfig({
  output: 'static',
  site: 'https://dynasties.oriz.in',
  integrations: [
    orizFleet({
      apiName: 'dynasties',
      apiTitle: 'Indian Dynasties API',
      apiDescription:
        'Free static API for Indian historical dynasties - period, rulers, capitals, region, religion, achievements. No auth, no rate limit, no cost.',
      stats: '260 records ; CC BY-SA 4.0 (data) ; MIT (code)',
      themeColor: 'emerald',
      githubRepo: 'oriz-org/dynasties-api',
      sampleEndpoint: '/dynasties/mauryan.json',
      sampleResponse: {
        slug: 'mauryan',
        name: 'Mauryan Empire',
        period: { start: -322, end: -185, start_era: 'BCE', end_era: 'BCE' },
        region: 'South Asia (most of subcontinent)',
        capitals: ['Pataliputra'],
        religion: 'Hinduism, Buddhism, Jainism (pluralistic)',
        notes: 'First pan-Indian empire.',
      },
      dataDirs: ['dynasties'],
      indexFiles: ['index.json', 'all.json', 'timeline.json', 'eras.json'],
    }),
  ],
});
