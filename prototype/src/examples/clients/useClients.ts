import { useSyncExternalStore } from 'react'
import { queryClient } from '@app/lib/queryClient'
import type { Client } from './fixtures'

// The example's data hook: the Klienci list, read from the real query cache, where demo/seed.ts put it. In an app this file is the real hook
// (a useQuery that calls clientsService); the kit swaps the app's hooks for ones like this, which read the cache and never reach a server.
//
// It READS THE CACHE THROUGH A SUBSCRIPTION (TASKS.md Decided 34; LEARNINGS L4, the second trap): a fake that reads `getQueryData` once while it
// renders never hears of a change that comes later, and a query that nothing fetches does not re-render on `setQueryData` either. The data of a
// real list arrives after the screen is drawn, and so does the fake's (seed.ts answers a moment after a DEMO state is applied); a hook without
// the subscription draws the empty first answer and stays there.
export const CLIENTS_KEY = ['clients'] as const

const subscribe = (notify: () => void) => queryClient.getQueryCache().subscribe(notify)
const readClients = () => queryClient.getQueryData<Client[]>(CLIENTS_KEY)
const readError = () => queryClient.getQueryState(CLIENTS_KEY)?.error ?? undefined

export function useClients(): { clients: Client[] | undefined; error: string | undefined } {
  const clients = useSyncExternalStore(subscribe, readClients)
  const error = useSyncExternalStore(subscribe, readError)
  // No data and no error: nothing has answered yet, which a screen shows as loading.
  return { clients, error: error?.message }
}
