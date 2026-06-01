# APCON Storyblok Astro

Astro + Vue 3 + Storyblok CMS site, scaffolded from `apcon-storyblok-nuxt`.

Vue components from the Nuxt project are reused as Astro islands with the same Storyblok integration: Visual Editor bridge, CDN polling, dev sync, and Netlify branch preview support.

## Requirements

- Node.js 22.12+ or 25+ (see `.node-version`)
- pnpm 10+
- mkcert (for HTTPS local dev / Storyblok Visual Editor)

## Setup

```bash
cp .env.example .env
# Add your Storyblok preview token and space settings

pnpm install
pnpm cert:generate
pnpm cert:trust
pnpm dev
```

For quick local preview without HTTPS:

```bash
pnpm dev:http
```

Open `https://localhost:3000` in Storyblok Visual Editor (location URL must match exactly).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | HTTPS dev server on port 3000 (Storyblok Visual Editor) |
| `pnpm dev:http` | HTTP dev server (no certs required) |
| `pnpm build` | Production build for Netlify |
| `pnpm preview` | Preview production build |
| `pnpm cert:generate` | Generate local HTTPS certs |
| `pnpm cert:trust` | Trust mkcert CA |

## Architecture

| Layer | Location |
|-------|----------|
| Astro pages | `src/pages/` |
| Vue islands | `src/components/` (copied from Nuxt) |
| Storyblok setup | `src/lib/storyblok-setup.ts` |
| CDN helpers | `src/utils/storyblok-cdn.ts` |
| Dev proxy API | `src/pages/api/storyblok/[slug].ts` |
| Netlify CDN proxy | `netlify/functions/storyblok-story.js` |
| Route map | `config/site-pages.ts` |

## Storyblok components

Blok components in `src/components/storyblok/` auto-register via `src/utils/storyblok-components.ts` (same mapping as the Nuxt project).

## Deploy

Netlify uses the `@astrojs/netlify` adapter (`pnpm build` → `dist/`).

Set in Netlify UI (Site configuration → Environment variables):

- `PUBLIC_STORYBLOK_ACCESS_TOKEN` — Storyblok preview token (required)
- `PUBLIC_STORYBLOK_VERSION=draft`
- `PUBLIC_STORYBLOK_LIVE_PREVIEW=true` (branch/deploy previews)

`netlify.toml` sets version/preview flags for branch and deploy previews; the access token must be added in the Netlify dashboard.

## Related repos

- Nuxt reference: `apcon-storyblok-nuxt`
- Gatsby reference: `apcon-storyblok-gatsby`
