import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import appConfig from '../app.config'

// The kit renders the real app's code from ../src, with the modules that reach a server swapped for fakes. A real module listed in SWAPS is
// replaced wherever it is imported, so the real screens, the real frame and the real components run unchanged on fake data. Lifted from
// Overload's prototype/vite.config.ts (its fakeDataLayer plugin); the swap list is the starter's own.
const here = path.dirname(fileURLToPath(import.meta.url))

// The real path of src/, not the path it is reached by (LEARNINGS L4, the first trap). Vite resolves every import to a real path; a swap keyed
// by a path that goes through a symlink never matches, and then nothing is swapped and nothing says so: the page would reach for a server.
const REPO = fs.realpathSync(path.resolve(here, '../src'))
const FAKES = path.resolve(here, 'src/fakes')
const OVERRIDES = path.resolve(here, 'src/overrides')

// The modules swapped, as a path inside src/ → the file in src/fakes/ that takes its place. Exactly the five the starter's screens reach a
// server through (prototype/check/kit.test.mjs holds the list to them): the Supabase client, who is signed in and the sign-in call, the
// connection, and the theme (which the kit's DEMO menu also sets). An app adds the hooks and services of its own screens here as it writes
// them, each with its fake.
const SWAPS: Record<string, string> = {
  'lib/supabase.ts': 'supabase.ts',
  'features/auth/useAuth.tsx': 'useAuth.tsx',
  'features/auth/authService.ts': 'authService.ts',
  'hooks/useOnlineStatus.ts': 'useOnlineStatus.ts',
  'features/settings/useTheme.ts': 'useTheme.ts',
}

// Real modules a spec changes, as a path inside src/. Each is replaced by its marked copy in src/overrides/ (made by override.mjs), which is
// the one place a copy of a real file may live in the kit. Empty on purpose: each spec chat starts from the real code as it is (L5), and
// clears this list and that folder when the build it was for has shipped.
const OVERRIDDEN: string[] = []

function fakeDataLayer(): Plugin {
  const swaps: Record<string, string> = Object.fromEntries([
    ...Object.entries(SWAPS).map(([real, fake]) => [path.join(REPO, real), path.join(FAKES, fake)]),
    ...OVERRIDDEN.map((real) => [path.join(REPO, real), path.join(OVERRIDES, path.basename(real))]),
  ])
  return {
    name: 'prototype-fake-data',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      // A fake may import the real module it stands in for (the sign-in error class, say): the swap applies to the app's imports, not to its own.
      if (!importer || importer.startsWith(FAKES)) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      // A swap never points a module at itself (an override that imports nothing of its own original).
      if (resolved && swaps[resolved.id] && swaps[resolved.id] !== importer) return swaps[resolved.id]
      return null
    },
  }
}

// package.json's version, as vite.config.ts defines it for the app, so Settings' build line reads as the app's does.
const { version } = JSON.parse(fs.readFileSync(path.resolve(here, '../package.json'), 'utf8')) as { version: string }

export default defineConfig({
  plugins: [fakeDataLayer(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@app': REPO,
      // vite-plugin-pwa's virtual module, which the real App.tsx reaches through src/features/pwa/pwaRegister.ts and which exists only under
      // the app's own plugin pipeline. The kit renders AppRoutes, never App(), so the registration is never called; the import still has to
      // resolve. Not a swap: it replaces a module the plugin makes up, not a file in src/.
      'virtual:pwa-register/react': path.join(FAKES, 'pwaRegister.ts'),
    },
  },
  // The four defines the app's build gives it (vite.config.ts). The hash and the time are fixed, so every run of the kit draws the same
  // build line ("Wersja 0.1.0 · build 3f9c2a1 · 06.11.2026 13:52", as the prototype wrote it).
  define: {
    __BUILD_HASH__: JSON.stringify('3f9c2a1'),
    __BUILD_TIME__: JSON.stringify('2026-11-06T12:52:00.000Z'),
    __APP_VERSION__: JSON.stringify(version),
    __APP_CONFIG__: JSON.stringify(appConfig),
  },
  // One page with everything in it (inline.mjs puts the script and the style into the HTML): fonts, icons and every chunk inline.
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
