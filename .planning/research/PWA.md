# PWA Offline Support Research

**Researched:** 2026-02-24
**Domain:** vite-plugin-pwa + Workbox for offline-first client-side React app
**Confidence:** HIGH (official docs + verified community patterns)

## Summary

`vite-plugin-pwa` v1.2.0 is the standard solution. It wraps Google Workbox and handles service worker generation, manifest creation, and precache configuration. Version 1.x requires Vite 7, which is exactly what this project uses (Vite ^7.3.1).

For a client-side-only app with no API calls, the setup is straightforward: use `generateSW` strategy (default) with expanded `globPatterns` to precache all assets on first visit. No runtime caching config needed since there are no network requests to intercept.

**Primary recommendation:** Install `vite-plugin-pwa` v1.2.0, use `generateSW` with `registerType: 'prompt'`, expand `globPatterns` to include all static assets, generate proper icons, and add a `ReloadPrompt` component.

---

## 1. Installation and Setup

### Install

```bash
npm install -D vite-plugin-pwa
```

This pulls in `workbox-build`, `workbox-window`, and other Workbox packages as transitive dependencies. No separate Workbox install needed.

**Version compatibility (verified):**
| Package | Project Version | vite-plugin-pwa Requirement |
|---------|----------------|---------------------------|
| vite | ^7.3.1 | v1.x requires Vite 7 |
| react | ^19.2.0 | No direct dependency -- works with any React |
| tailwindcss | ^4.2.0 | No interaction -- Tailwind CSS is bundled by Vite at build time |

### vite.config.ts Changes

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['**/*'],  // cache everything in public/
      manifest: {
        name: 'Expense Splitter',
        short_name: 'Splitter',
        description: 'Split bills with friends',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### TypeScript Configuration

Add `"vite-plugin-pwa/react"` to the `types` array in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "vite-plugin-pwa/react"]
  }
}
```

This provides type declarations for the `virtual:pwa-register/react` module used by the `useRegisterSW` hook.

---

## 2. Service Worker Strategy

### Why `generateSW` (not `injectManifest`)

| Strategy | What it does | When to use |
|----------|-------------|-------------|
| `generateSW` (default) | Plugin auto-generates the entire service worker | Client-side apps with no custom SW logic |
| `injectManifest` | You write a custom SW, plugin injects precache manifest | Apps needing custom caching, push notifications, background sync |

**Use `generateSW`.** This app has no API calls, no push notifications, no background sync. The auto-generated SW with precaching is exactly right.

### Caching Behavior

With `generateSW`, the plugin uses Workbox precaching:

1. **Build time:** Workbox scans the `dist/` folder using `globPatterns`, generates a precache manifest with file hashes
2. **First visit:** Service worker installs and caches all matched files
3. **Subsequent visits:** All assets served from cache (zero network requests)
4. **App update:** New build produces new file hashes, SW detects the diff, downloads only changed files

**Default `globPatterns`:** `**/*.{js,css,html}` -- this misses images, icons, fonts, SVGs.

**Required override for full offline:**
```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
}
```

**`includeAssets`:** Controls which files from Vite's `public/` directory get added to the SW precache (in addition to `globPatterns` which matches built output). Use `['**/*']` to cache everything in public/.

### No Runtime Caching Needed

Runtime caching (`workbox.runtimeCaching`) is for intercepting network requests at runtime (e.g., API calls, CDN fonts). This app:
- Has no API calls
- Bundles all CSS (Tailwind via Vite plugin)
- No CDN dependencies

Skip `runtimeCaching` entirely. Precaching handles everything.

---

## 3. Service Worker Update Strategy

### `registerType: 'prompt'` (recommended)

| Option | Behavior | UX |
|--------|----------|-----|
| `'autoUpdate'` | New SW activates immediately, reloads all tabs | Disruptive; user could lose in-progress work |
| `'prompt'` | Shows notification, user clicks to update | User controls when update happens |

**Use `'prompt'`** because this is a bill-splitting app where users may have unsaved inputs. An auto-reload mid-entry would be frustrating.

### ReloadPrompt Component

```tsx
// src/components/ReloadPrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div role="alert" className="fixed bottom-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg">
      {offlineReady && (
        <p>App ready to work offline.</p>
      )}
      {needRefresh && (
        <p>New version available.</p>
      )}
      <div className="mt-2 flex gap-2">
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded bg-blue-600 px-3 py-1 text-white"
          >
            Update
          </button>
        )}
        <button onClick={close} className="rounded border px-3 py-1">
          Close
        </button>
      </div>
    </div>
  )
}

export default ReloadPrompt
```

Mount in `App.tsx`:

```tsx
import ReloadPrompt from './components/ReloadPrompt'

function App() {
  return (
    <>
      {/* existing app content */}
      <ReloadPrompt />
    </>
  )
}
```

---

## 4. Web App Manifest and Icons

### Required Manifest Fields for Install Prompt

Chrome's installability criteria (verified from web.dev):
- `name` or `short_name` -- at least one required
- `icons` -- must include 192x192 AND 512x512 PNG
- `start_url` -- where the app opens
- `display` -- must be `standalone`, `fullscreen`, or `minimal-ui`
- Service worker with a fetch handler -- provided by vite-plugin-pwa automatically

All fields are set in the `VitePWA({ manifest: {...} })` config above. The plugin generates `manifest.webmanifest` in the build output and injects the `<link rel="manifest">` tag automatically.

### Icon Requirements

| Size | Purpose | Required? |
|------|---------|-----------|
| 192x192 | Home screen icon (Android), various UI surfaces | Yes |
| 512x512 | Splash screen (Android), Windows tile | Yes |
| 512x512 (maskable) | Adaptive icon that can be cropped to circle/squircle | Strongly recommended |

**Maskable icon safe zone:** The visible area is a circle with 80% diameter of the icon. Keep the logo within the inner ~80% of the canvas. Test with https://maskable.app/editor.

**File placement:** Put icon PNGs in `public/`:
```
public/
  pwa-192x192.png
  pwa-512x512.png
```

**Icon generation approach:** Create icons from the app logo. Can use any image tool. For a simple approach, create a 512x512 PNG with the logo centered and a solid background color, then resize to 192x192.

### HTTPS Requirement

- **Production:** HTTPS is required for service workers and install prompt. Any modern hosting (Vercel, Netlify, Cloudflare Pages) provides this automatically.
- **localhost:** Service workers work on `http://localhost` without HTTPS. This is a browser exception specifically for development. The install prompt also works on localhost.
- **Dev mode:** `vite-plugin-pwa` does NOT register the service worker during `vite dev` by default. It only activates in `vite build` + `vite preview`. If you want to test in dev, add `devOptions: { enabled: true }`, but this is usually unnecessary.

---

## 5. Pitfalls Specific to This Stack

### Pitfall 1: globPatterns Override (not Extend)

**What goes wrong:** You set `globPatterns: ['**/*.png']` thinking it adds to the defaults. It replaces them. Now JS and CSS are not cached.

**How to avoid:** Always include ALL file types in your custom pattern:
```typescript
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
```

### Pitfall 2: Stale App After Deploy

**What goes wrong:** You deploy a new version but users keep seeing the old app because the service worker serves cached content.

**Why it happens:** With `registerType: 'autoUpdate'`, the new SW activates on next navigation. With `registerType: 'prompt'`, the user must click "Update." If the prompt is not visible or gets dismissed, they are stuck.

**How to avoid:** Make the `ReloadPrompt` component clearly visible and persistent. Consider adding periodic update checks:
```typescript
useRegisterSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 60 * 1000) // hourly
    }
  },
})
```

### Pitfall 3: localStorage Data vs. Cached App Version Mismatch

**What goes wrong:** A new app version changes the Zustand store shape. The service worker serves the new JS, but localStorage still has data in the old format. App crashes or shows corrupted state.

**Why it happens:** Service worker cache and localStorage are independent. SW updates the app code; localStorage retains the old data.

**How to avoid:** This project already has `deserializeBillConfig.ts` for migration. Ensure the Zustand `persist` middleware's `version` field is incremented on schema changes, and the `migrate` function handles old versions. This is NOT a PWA-specific issue -- it exists already -- but PWA makes it more visible because users stay on old versions longer.

### Pitfall 4: Service Worker Caching the index.html Navigation

**What goes wrong:** Single-page apps need `index.html` served for all routes. The default Workbox `generateSW` precaching handles this correctly via `navigateFallback`. No action needed -- but be aware this is happening.

### Pitfall 5: Dev Mode Confusion

**What goes wrong:** Developer enables `devOptions: { enabled: true }`, then the service worker caches dev assets. Hot module replacement breaks. Dev experience becomes confusing.

**How to avoid:** Do NOT enable `devOptions` unless specifically testing PWA behavior. Test PWA via `npm run build && npm run preview` instead. If you do enable devOptions, remember to clear the service worker in DevTools > Application > Service Workers when you disable it.

### Pitfall 6: Tailwind CSS 4 and Caching

**Non-issue.** Tailwind CSS 4 with `@tailwindcss/vite` generates CSS at build time. The output is a standard hashed `.css` file in `dist/assets/`. Workbox precaches it like any other CSS file. The Vite plugin approach (vs. PostCSS) makes no difference to the service worker.

### Pitfall 7: Large Precache Payload

**What goes wrong:** Using `globPatterns: ['**/*']` caches everything including source maps, unused assets, etc.

**How to avoid:** Be explicit about file extensions. Only cache what the app actually needs:
```typescript
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
```
Check the precache manifest size after build. Workbox logs a warning if total precache exceeds 2MB by default (`maximumFileSizeToCacheInBytes`).

---

## 6. Implementation Checklist

Ordered steps for adding PWA support:

1. **Install:** `npm install -D vite-plugin-pwa`
2. **Create icons:** Place `pwa-192x192.png` and `pwa-512x512.png` in `public/`
3. **Configure plugin:** Add `VitePWA()` to `vite.config.ts` with manifest, workbox, and registerType settings
4. **Add types:** Add `"vite-plugin-pwa/react"` to `tsconfig.app.json` types array
5. **Create ReloadPrompt:** Build the component using `useRegisterSW` hook
6. **Mount ReloadPrompt:** Add to `App.tsx`
7. **Update index.html title:** Change from "gsd-vite-scaffold" to app name
8. **Build and test:** `npm run build && npm run preview`, then test offline in DevTools
9. **Verify install prompt:** Open in Chrome, check for install icon in address bar

### Testing Offline Behavior

1. Run `npm run build && npm run preview`
2. Open `http://localhost:4173` in Chrome
3. Open DevTools > Application > Service Workers -- verify SW is registered
4. Open DevTools > Application > Cache Storage -- verify assets are cached
5. Go to DevTools > Network > check "Offline"
6. Reload the page -- it should load fully from cache
7. Navigate within the app -- all routes should work
8. Uncheck "Offline" and verify normal operation resumes

---

## 7. Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `vite.config.ts` | Modify | Add VitePWA plugin |
| `tsconfig.app.json` | Modify | Add vite-plugin-pwa/react types |
| `index.html` | Modify | Update title (manifest handles the rest) |
| `public/pwa-192x192.png` | Create | App icon 192x192 |
| `public/pwa-512x512.png` | Create | App icon 512x512 |
| `src/components/ReloadPrompt.tsx` | Create | Update prompt UI |
| `src/App.tsx` | Modify | Mount ReloadPrompt |

The plugin auto-generates these at build time (do NOT create manually):
- `dist/manifest.webmanifest`
- `dist/sw.js`
- `dist/workbox-*.js`

---

## Sources

### Primary (HIGH confidence)
- [vite-plugin-pwa official guide](https://vite-pwa-org.netlify.app/guide/) -- configuration, strategies, options
- [vite-plugin-pwa React framework docs](https://vite-pwa-org.netlify.app/frameworks/react) -- useRegisterSW, type declarations
- [vite-plugin-pwa precache docs](https://vite-pwa-org.netlify.app/guide/service-worker-precache) -- globPatterns, default behavior
- [vite-plugin-pwa GitHub releases](https://github.com/vite-pwa/vite-plugin-pwa/releases) -- v1.2.0 latest, Vite 7 support confirmed
- [MDN PWA icon guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons) -- sizes, maskable

### Secondary (MEDIUM confidence)
- [Totally offline PWA with Vite + React](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/) -- real-world pattern for includeAssets + globPatterns
- [DeepWiki vite-plugin-pwa config options](https://deepwiki.com/vite-pwa/vite-plugin-pwa/2-configuration-options) -- cross-verified with official docs
- [vite-plugin-pwa development guide](https://vite-pwa-org.netlify.app/guide/development) -- devOptions, localhost behavior
