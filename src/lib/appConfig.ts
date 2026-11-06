import type { AppConfig } from '../../app.config'

// The app's name, colours, icons and language. `app.config.ts` at the repo root is the one place they are set: vite.config.ts reads it for
// the install manifest and index.html, and gives it to the app as `__APP_CONFIG__`, a `define`; this file is the one place the app reads
// it, the way version.ts reads `__APP_VERSION__`. With no define there is no config: a test that imports this file gets one from
// vitest.setup.ts, and the import throws a ReferenceError when a test has taken it away (`vi.unstubAllGlobals()`).
export const APP_CONFIG: AppConfig = __APP_CONFIG__
