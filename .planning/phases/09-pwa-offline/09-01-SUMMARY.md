---
phase: 09-pwa-offline
plan: 01
title: "PWA plugin setup, manifest, and icons"
subsystem: pwa
tags: [pwa, service-worker, manifest, icons, vite-plugin]
dependency_graph:
  requires: []
  provides: [sw.js, manifest.webmanifest, pwa-icons]
  affects: [vite.config.ts, index.html, tsconfig.app.json]
tech_stack:
  added: [vite-plugin-pwa@1.2.0, workbox]
  patterns: [generateSW, registerType-prompt]
key_files:
  created:
    - public/pwa-192x192.png
    - public/pwa-512x512.png
  modified:
    - vite.config.ts
    - tsconfig.app.json
    - index.html
    - package.json
decisions:
  - "Used registerType: 'prompt' for user-controlled SW updates"
  - "Gray-950 (#030712) for theme_color and background_color to match dark theme"
  - "Programmatic PNG generation for icons using raw PNG encoding (no external deps)"
metrics:
  duration: "2m 34s"
  completed: "2026-02-24"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 9 Plan 1: PWA Plugin Setup, Manifest, and Icons Summary

vite-plugin-pwa v1.2.0 with generateSW strategy, registerType: 'prompt', standalone manifest with dollar-sign icons on gray-950 background

## Tasks Completed

| Task | Description | Commit | Key Changes |
|------|-------------|--------|-------------|
| 1 | Install vite-plugin-pwa and configure Vite | 699832c | vite.config.ts: added VitePWA plugin with manifest, workbox config |
| 2 | Create PWA icons and update HTML | 699832c | public/pwa-192x192.png, public/pwa-512x512.png, index.html title + theme-color |
| 3 | Update TypeScript configuration | 699832c | tsconfig.app.json: added vite-plugin-pwa/react types |

## Verification Results

- `npx tsc --noEmit` -- passed (zero errors)
- `npx vitest run` -- 144 tests passed across 12 files
- `npm run build` -- succeeded, 11 precache entries (272.91 KiB)
- `dist/sw.js` -- present (1547 bytes)
- `dist/workbox-1ef09536.js` -- present (15037 bytes)
- `dist/manifest.webmanifest` -- present with correct name, icons (3), display: standalone

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **registerType: 'prompt'** -- Users will be prompted to update the SW rather than auto-updating, preventing unexpected reloads mid-bill-split
2. **Programmatic PNG generation** -- Created valid PNG icons using raw Node.js PNG encoding (zlib + CRC32) without requiring canvas or sharp packages; icons show a dollar sign on dark background with circle border
3. **includeAssets: ['**/*']** -- All public/ assets included for precaching, ensuring offline availability

## Commits

- `699832c`: feat(pwa): add vite-plugin-pwa with manifest and icons

## Self-Check: PASSED

All claimed files exist. All commit hashes verified.
