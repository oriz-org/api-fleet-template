# @oriz/api-fleet-template

Astro Integration that gives an oriz-org static API repo (`rto-api`, `constants-api`, `ragas-api`, `dynasties-api`, `countries-plus-api`, ...) its shared shell:

- `/` landing page (hero, sample curl + JSON, jsDelivr instructions, stats)
- `/docs` API reference (auto-generated endpoint table from `dataDirs` + `indexFiles`)
- `/explorer` interactive dropdown demo (fetches the first index file, renders selected record)
- Tailwind v4 wiring (via `@tailwindcss/vite`)
- Prebuild step: hardlinks `dataDirs/` and `indexFiles` from repo root into `public/` so Astro ships them in `dist/`
- Theming via a single `themeColor` (Tailwind palette name or 6-char hex)

## Usage

In a new oriz API repo:

```bash
npm i astro tailwindcss @tailwindcss/vite @oriz/api-fleet-template
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import orizFleet from '@oriz/api-fleet-template';

export default defineConfig({
  output: 'static',
  site: 'https://NEW-API.oriz.in',
  integrations: [
    orizFleet({
      apiName: 'NEW-API',
      apiTitle: 'New API Title',
      apiDescription: 'One-line description.',
      stats: 'N records ; CC BY-SA ; MIT',
      themeColor: 'emerald',
      githubRepo: 'oriz-org/new-api',
      sampleEndpoint: '/things/example.json',
      sampleResponse: { /* ... */ },
      dataDirs: ['things'],
      indexFiles: ['index.json', 'all.json'],
    }),
  ],
});
```

That is the entire `astro.config.mjs` a consuming API needs. No layout file, no pages, no prebuild script.

## Config reference

| Key | Type | Notes |
|---|---|---|
| `apiName` | `string` | Slug used in `<apiName>.oriz.in` and nav. |
| `apiTitle` | `string` | Display title (e.g. `"Indian Dynasties API"`). |
| `apiDescription` | `string` | Meta + hero subtitle. |
| `stats` | `string` | Footer/landing line (e.g. `"260 records ; CC BY-SA ; MIT"`). |
| `themeColor` | `string` | Tailwind palette name (`emerald`, `rose`, `indigo`, ...) OR hex like `#10b981`. |
| `githubRepo` | `string` | `"owner/name"`, used for jsDelivr URL + GitHub nav link. |
| `sampleEndpoint` | `string` | Path shown in the curl example on landing. |
| `sampleResponse` | `unknown` | JSON object shown next to the curl. |
| `dataDirs` | `string[]` | Folders at repo root to mirror into `public/`. |
| `indexFiles` | `string[]` | Top-level JSON files at repo root to mirror into `public/`. |
| `endpoints` | `Array<{path,returns,sample}>` | Optional override for `/docs` table. Auto-derived if omitted. |
| `licenseBlurb` | `string` | Optional override for `/docs` license footer. |

## What you put in the consuming repo

```
<your-api>/
  astro.config.mjs            # the snippet above
  package.json
  public/
    favicon.svg               # optional
  things/                     # one of your dataDirs
    foo.json
    bar.json
  index.json                  # one of your indexFiles
  all.json
```

`things/` and the JSON files at repo root stay canonical (jsDelivr serves them at `https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/things/foo.json`). The integration mirrors them into `public/` at build time using hardlinks, so they also ship in `dist/` for Cloudflare Pages.

## Explorer index file format

The explorer fetches the **first** entry of `indexFiles` and expects either:
- a JSON array of slug strings, or
- a JSON array of objects with `slug` (+ optional `name` / `title` / `label`), or
- `{ "records": [...] }` of either form.

## Theming

`themeColor: 'emerald'` resolves to the Tailwind `emerald-50..950` palette and is exposed as `--color-primary-50` through `--color-primary-950` on `:root`. Use in custom CSS via `var(--color-primary-700)`.

Pass a hex base (e.g. `themeColor: '#3b82f6'`) and the layout synthesises a tint/shade scale by mixing with white/black at standard ratios.

Supported palette names: `slate`, `gray`, `zinc`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`.

## Publishing this package

```bash
npm version <patch|minor|major>
npm publish --access public
```

The package is published as `@oriz/api-fleet-template` (scoped, public). The `publishConfig` in `package.json` already sets `access: public`.

## Local development against a consuming repo

```bash
# from this repo
npm pack          # produces oriz-api-fleet-template-<version>.tgz
# from the consuming API repo
npm i ../path/to/oriz-api-fleet-template-<version>.tgz
```

Or use `npm link`:

```bash
# in this repo
npm link
# in the consuming repo
npm link @oriz/api-fleet-template
```

## How it works under the hood

The integration registers two Astro hooks:

- `astro:config:setup` - calls `injectRoute()` three times for `/`, `/docs`, `/explorer`, registers a Vite virtual-module plugin that exposes the user's config at `virtual:oriz-fleet-config`, and (if the peer dep is present) adds `@tailwindcss/vite` to `vite.plugins`.
- `astro:build:start` - spawns the bundled `prebuild.cjs` against the consuming repo's cwd, hardlinking `dataDirs/` and `indexFiles` from repo root into `public/`.

Pages import the user's config via `import fleetConfig from 'virtual:oriz-fleet-config'`, so no template strings, no env vars, no codegen.

## License

MIT.
