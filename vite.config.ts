import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import appConfig, { type AppConfig } from './app.config'

// Vercel sets this from the actual deployed commit — prefer it over shelling
// out, since a build environment isn't guaranteed to have git history
// available. Falls back to a local `git` call for `npm run dev`/local
// builds, and to 'unknown' if even that fails (e.g. no .git present at all)
// rather than failing the build over a display-only value.
function resolveBuildHash(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

const BUILD_HASH = resolveBuildHash()
const BUILD_TIME = new Date().toISOString()

// The app's version: `package.json`'s `version`, the one place it is set.
// It reaches the app as `__APP_VERSION__`, beside the build hash and time, and src/lib/version.ts is the one place the app reads it.
// Read from the file next to this one, not from the working directory, and refused when it is not dotted numbers: a version the
// app could not compare would pass or fail a release gate wrongly (an app that adds required updates compares versions).
function resolveAppVersion(): string {
  const { version } = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version?: unknown }
  if (typeof version !== 'string' || !/^\d+(\.\d+){1,2}$/.test(version)) {
    throw new Error(`package.json's "version" must be dotted numbers such as 0.1.0, got ${JSON.stringify(version)}`)
  }
  return version
}

const APP_VERSION = resolveAppVersion()

const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// index.html carries the app's language, title, favicon and theme colour as app.config.ts has them today, so the file reads on its
// own; this plugin writes the config's values over them, so the config is the one place they are set. It refuses to build when a tag it
// should fill is not in index.html (a page that quietly kept an old name or colour is the failure this prevents).
function appHtml(config: AppConfig): Plugin {
  const fill = (html: string, pattern: RegExp, value: string): string => {
    if (!pattern.test(html)) throw new Error(`index.html has nothing matching ${pattern} for app.config.ts to fill`)
    return html.replace(pattern, (_match, before: string, after: string) => `${before}${escapeAttribute(value)}${after}`)
  }
  return {
    name: 'app-html',
    transformIndexHtml(html) {
      let out = html
      out = fill(out, /(<html lang=")[^"]*(")/, config.locale)
      out = fill(out, /(<title>)[^<]*(<\/title>)/, config.name)
      out = fill(out, /(<link rel="icon"[^>]* href="\/)[^"]*(")/, config.icons.favicon)
      out = fill(out, /(<meta name="theme-color" content=")[^"]*(")/, config.themeColor)
      return out
    },
  }
}

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(BUILD_HASH),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_CONFIG__: JSON.stringify(appConfig),
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':    ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    appHtml(appConfig),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration is done explicitly via `virtual:pwa-register/react`
      // (see src/features/pwa/useServiceWorker.ts) instead of the auto-injected
      // <script>, so it can wire onNeedReload to a handler that only records
      // that a newer worker is running, instead of the library's default silent
      // window.location.reload(). The app has no update screen: a new version
      // installs in the background and is used the next time the app opens.
      injectRegister: false,
      includeAssets: [appConfig.icons.favicon, appConfig.icons.icon192, appConfig.icons.icon512],
      manifest: {
        name: appConfig.name,
        short_name: appConfig.shortName,
        description: appConfig.description,
        lang: appConfig.locale,
        theme_color: appConfig.themeColor,
        background_color: appConfig.backgroundColor,
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: `/${appConfig.icons.icon192}`, sizes: '192x192', type: 'image/png' },
          { src: `/${appConfig.icons.icon512}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // woff2 is named here, so the bundled fonts (src/styles/global.css) are in the precache and the app opens offline with them.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // vite-plugin-pwa only auto-sets workbox.skipWaiting/clientsClaim from
        // registerType: 'autoUpdate' when injectRegister is 'auto' or unset
        // (its own index.js gates that on injectRegister, not just
        // registerType). injectRegister: false above skips that wiring, so it
        // has to be set explicitly here — without it, workbox-build's own
        // default (false for both) ships a service worker that sits in
        // 'waiting' indefinitely with a tab open (it skips waiting only when a
        // page posts it a SKIP_WAITING message, which nothing here does) and
        // 'activated' never fires, so a new version would be used only once
        // every tab of the app had been closed, and nothing in an app with no
        // update screen would say so. Confirmed against a built dist/sw.js
        // without skipWaiting; scripts/check-build.mjs fails when the built
        // sw.js does not call self.skipWaiting() and clientsClaim() as it loads.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
