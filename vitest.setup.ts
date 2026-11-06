// The build's defines in tests. vite.config.ts defines `__APP_VERSION__`, `__BUILD_HASH__`, `__BUILD_TIME__` and `__APP_CONFIG__` for the
// build and the dev server; vitest runs no define, and src/lib/version.ts and src/lib/appConfig.ts refuse to load without theirs. A test
// of anything that reaches them would otherwise have to stub them itself, so each test file starts with the values the build would give:
// package.json's version, app.config.ts's config, and a fixed hash and time. A file that needs another value stubs it with
// `vi.stubGlobal`, which replaces this one, and `vi.unstubAllGlobals()` takes this one away too: version.test.ts still sees a module that
// refuses to load when no version was given at all.
import { vi } from 'vitest'
import { version } from './package.json'
import appConfig from './app.config'

vi.stubGlobal('__APP_VERSION__', version)
vi.stubGlobal('__BUILD_HASH__', '0000000')
vi.stubGlobal('__BUILD_TIME__', '2026-11-06T12:52:00.000Z')
vi.stubGlobal('__APP_CONFIG__', appConfig)
