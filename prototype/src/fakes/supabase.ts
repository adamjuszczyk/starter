// Lifted from Overload's prototype/src/fakes/supabase.ts. The kit never reaches a database. Every call on this client stays pending, so a real
// hook that asks it for something keeps the data the DEMO put in the query cache (demo/seed.ts): an unseeded read shows as loading, which is how a
// missing fixture shows up.
//
// Swapping this module is what keeps the page from throwing at load: src/lib/supabase.ts refuses to load without a project URL and key, and
// something in the real chain still loads it (the real authService, through fakes/authService.ts's re-export of its error class). Take the swap
// out of vite.config.ts and the page fails at once with "Missing Supabase env vars"; the check reports that page error.
const pending = new Promise<never>(() => {})

// Typed `any` on purpose: it stands in for the whole client, whatever a real module asks of it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chain: any = new Proxy(function () {}, {
  get: (_target, prop) => (prop === 'then' ? pending.then.bind(pending) : chain),
  apply: () => chain,
})

export const supabase = chain
