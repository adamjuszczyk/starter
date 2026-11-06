/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Injected by vite.config.ts's `define` — short commit hash + build
// timestamp of whatever's actually running, shown in Settings. Real
// string literals at build time, not runtime values — see
// resolveBuildHash() in vite.config.ts.
declare const __BUILD_HASH__: string
declare const __BUILD_TIME__: string

// The app's version — package.json's `version`, read by vite.config.ts's `define` the same way. src/lib/version.ts is the one place the
// app reads it; a test that imports that file stubs this first, as the two above are stubbed (vitest.setup.ts does it for every test file).
declare const __APP_VERSION__: string

// The app's name, colours, icons and language — app.config.ts, given to the app by vite.config.ts's `define` as one object literal.
// src/lib/appConfig.ts is the one place the app reads it.
declare const __APP_CONFIG__: import('../app.config').AppConfig
