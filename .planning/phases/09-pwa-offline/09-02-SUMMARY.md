---
phase: 09-pwa-offline
plan: 02
title: "ReloadPrompt component and App integration"
subsystem: pwa
tags: [pwa, service-worker, reload-prompt, offline-ready, update-notification]
dependency_graph:
  requires: [sw.js, manifest.webmanifest]
  provides: [ReloadPrompt-component, sw-update-ui]
  affects: [src/App.tsx]
tech_stack:
  added: []
  patterns: [useRegisterSW-hook, prompt-update-ui]
key_files:
  created:
    - src/components/ReloadPrompt.tsx
  modified:
    - src/App.tsx
decisions:
  - "Named export for ReloadPrompt to match project conventions"
  - "bottom-20 positioning to clear TabBar without overlap"
  - "gray-800 toast on gray-950 background for visual contrast while staying in dark theme"
metrics:
  duration: "1m 3s"
  completed: "2026-02-24"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 9 Plan 2: ReloadPrompt Component and App Integration Summary

ReloadPrompt component using useRegisterSW hook for offline-ready confirmation and new-version update prompts, positioned above TabBar with dark theme styling

## Tasks Completed

| Task | Description | Commit | Key Changes |
|------|-------------|--------|-------------|
| 1 | Create ReloadPrompt component | 757486c | src/components/ReloadPrompt.tsx: useRegisterSW, offline/update toasts, dismiss logic |
| 2 | Mount ReloadPrompt in App.tsx | 757486c | src/App.tsx: Fragment wrapper, ReloadPrompt alongside AppShell |

## Verification Results

- `npx tsc --noEmit` -- passed (zero errors)
- `npx vitest run` -- 144 tests passed across 12 files
- `npm run build` -- succeeded, 11 precache entries (281.35 KiB), sw.js generated

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Named export** -- `export function ReloadPrompt()` rather than default export, matching all other component files in the project
2. **bottom-20 positioning** -- Places the toast above the fixed TabBar (~48px + safe area) so both are visible simultaneously
3. **gray-800 on gray-950** -- Toast background slightly lighter than page background for visual distinction while staying in dark theme
4. **role="alert"** -- ARIA alert role for screen reader accessibility

## Commits

- `757486c`: feat(pwa): add ReloadPrompt for offline-ready and update notifications

## Self-Check: PASSED

All claimed files exist. All commit hashes verified.
