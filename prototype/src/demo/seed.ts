import { queryClient } from '@app/lib/queryClient'
import { CLIENTS_KEY } from '../examples/clients/useClients'
import { clients, loadErrorReason } from '../examples/clients/fixtures'
import { base, useDemo } from './demoStore'
import type { DemoValues, ListState } from './demoStore'

// Fake data for the kit, put into the REAL query cache under the key the example's hook reads (Overload's demo/seed.ts, the shape): the real
// hooks of an app read it as they would read a server's answer. This file is the fake server's side of the DEMO: what the cache holds for each
// state of the Klienci list, and what applying a state does to the world.

/** What the DEMO's list state puts in the cache. `loading` puts nothing: no answer ever comes, which is what loading is. */
function answerClients(view: ListState): void {
  switch (view) {
    case 'full':
      queryClient.setQueryData(CLIENTS_KEY, clients)
      break
    case 'empty':
      queryClient.setQueryData(CLIENTS_KEY, [])
      break
    case 'error':
      // A query whose read failed: no data, an error, nothing in flight. The hook reads it back as `error`.
      queryClient
        .getQueryCache()
        .build(queryClient, { queryKey: CLIENTS_KEY })
        .setState({ status: 'error', error: new Error(loadErrorReason), errorUpdatedAt: Date.now(), fetchStatus: 'idle' })
      break
    case 'loading':
      break
  }
}

/** Takes the list's answer back: the screen shows loading until the next one (the Retry button asks for this). */
export function clearClients(): void {
  queryClient.removeQueries({ queryKey: CLIENTS_KEY })
}

/** Before the first paint (main.tsx): the cache holds the starting state's data, and no read is retried (a retry would only delay an error). */
export function seed(): void {
  const defaults = queryClient.getDefaultOptions()
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } })
  answerClients(base.list)
}

// How long after a state is applied the list's answer arrives. A server answers after the screen is drawn, and the kit does the same on
// purpose: the screen mounts with nothing (loading), then the answer lands in the cache. A hook that reads the cache once while it renders
// misses it, so every state that shows the list proves the hook's subscription (examples/clients/useClients.ts); the check breaks on one without.
const ANSWER_AFTER_MS = 30
let answering: ReturnType<typeof setTimeout> | undefined

/**
 * Puts the world into a DEMO state: everything back to `base`, then the state's own changes, with the app drawn afresh (App.tsx keys it by
 * `applied`) and the list's answer on its way. The theme and the frame are the menu's own and stay.
 */
export function applyState(patch: Partial<DemoValues>): void {
  const next = { ...base, ...patch }
  clearTimeout(answering)
  clearClients()
  useDemo.setState((s) => ({ ...next, menuOpen: false, applied: s.applied + 1 }))
  answering = setTimeout(() => answerClients(next.list), ANSWER_AFTER_MS)
}
