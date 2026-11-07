// Copies a real file from ../src into src/overrides/, pointing its relative imports back at the real source (@app/...), so the copy can be
// changed for a spec while everything it uses stays the real code. Lifted from Overload's prototype/override.mjs.
//
//   node prototype/override.mjs shell/AppShell.tsx        (from the repo root; any folder works)
//
// Then add the same path to OVERRIDDEN in vite.config.ts, which is what makes every import of the real file take the copy, and mark each
// change in the copy with a comment that names the spec's item, so the diff against the original shows exactly what the spec changes.
// Only imports written as `from './x'` are repointed: a side-effect import (`import './x.css'`) or `import('./x')` is not, so look for them.
// An override is a copy of a real file by design: it is the one place the kit may hold one (check/kit.test.mjs leaves src/overrides/ out).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = fs.realpathSync(path.resolve(here, '../src'))
const OUT = path.join(here, 'src/overrides')

if (process.argv.length < 3) {
  console.error('usage: node prototype/override.mjs <path inside src/> [more paths]')
  process.exit(1)
}
fs.mkdirSync(OUT, { recursive: true })
for (const rel of process.argv.slice(2)) {
  const dir = path.dirname(rel)
  const text = fs
    .readFileSync(path.join(REPO, rel), 'utf8')
    .replace(/from '(\.\.?\/[^']+)'/g, (_match, p) => `from '@app/${path.posix.normalize(path.posix.join(dir, p))}'`)
  const out = path.join(OUT, path.basename(rel))
  fs.writeFileSync(out, text)
  console.log('override', rel, '->', path.relative(process.cwd(), out))
}
