import { queryClient } from '@app/lib/queryClient'
import { useDemo } from '../../demo/demoStore'
import { CLIENTS_KEY } from './useClients'
import type { Client, ClientInput } from './fixtures'

// The example's service, faked. In an app this is clientsService.ts, the one place a client is written to the server (SPEC Rule 4: reads and
// writes live in service and hook files); the kit's copy never reaches a server, and what a save does is what the DEMO says (TASKS.md Decided 36:
// the example is where the kit shows SPEC Rule 3, saving needs a connection):
//   form 'saving'   the save never ends, so the form stays in "Zapisywanie…";
//   form 'failed'   the save is refused, so the form stays open with everything typed and says so (`clientForm.saveFailed`);
//   otherwise       the save works: the change lands in the query cache, and the list (which reads the cache through a subscription) shows it.
// Offline, the form does not call this at all: Save is off and says why. Nothing is queued.

const SERVER_TIME_MS = 250

const answerAfterAWhile = () => new Promise<void>((resolve) => setTimeout(resolve, SERVER_TIME_MS))

export async function saveClient(input: ClientInput, id?: string): Promise<void> {
  const { form } = useDemo.getState()
  if (form === 'saving') return new Promise<void>(() => {})
  if (form === 'failed') throw new Error('The fake server refused the save.')
  await answerAfterAWhile()
  queryClient.setQueryData<Client[]>(CLIENTS_KEY, (list = []) =>
    id ? list.map((c) => (c.id === id ? { ...c, ...input } : c)) : [{ ...input, id: `new-${list.length + 1}`, added: new Date().toISOString().slice(0, 10) }, ...list],
  )
}

export async function deleteClient(id: string): Promise<void> {
  await answerAfterAWhile()
  queryClient.setQueryData<Client[]>(CLIENTS_KEY, (list = []) => list.filter((c) => c.id !== id))
}
