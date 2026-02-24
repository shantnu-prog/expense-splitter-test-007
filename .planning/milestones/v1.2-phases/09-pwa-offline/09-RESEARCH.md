See: .planning/research/PWA.md (researched 2026-02-24, HIGH confidence)

Key decisions from research:
- vite-plugin-pwa v1.2.0 with generateSW strategy
- registerType: 'prompt' (not autoUpdate) to protect in-progress input
- globPatterns: '**/*.{js,css,html,ico,png,svg,woff2}' for full offline
- Icons: 192x192 + 512x512 PNG in public/
- ReloadPrompt component using useRegisterSW hook from virtual:pwa-register/react
- Add vite-plugin-pwa/react to tsconfig.app.json types
