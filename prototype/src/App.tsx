import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { AppRoutes } from '@app/App'
import { useToastStore } from '@app/features/notifications/toastStore'
import { cx } from '@app/lib/cx'
import { queryClient } from '@app/lib/queryClient'
import { TABS } from '@app/shell/tabs'
import type { Tab } from '@app/shell/tabs'
import { DemoButton, DemoMenu } from './demo/DemoMenu'
import { base, useDemo } from './demo/demoStore'
import ClientsScreen from './examples/clients/ClientsScreen'
import { exampleWords as w } from './examples/words'
import { DesignSystemScreen } from './screens/DesignSystem'

// The kit's page: the REAL app, drawn by the real AppRoutes (its frame, its sign-in page, its shell, Settings, the toast) under a MemoryRouter,
// with the DEMO button and menu around it (TASKS.md, Decided 3; Overload's kit assembled a shell of its own from real parts instead). Nothing
// here draws the app's frame a second time: AppRoutes carries its own WidthRoot (Decided 45), and what this file adds around it is only the box
// it is given, the phone frame's.
//
// The example screens are mounted the way a build mounts its own: as a tab in the real TABS (src/shell/tabs.ts), which is the one place the real
// AppRoutes and AppShell read the app's screens from. The kit pushes its tab into that array when the page loads, and takes it out for the "New
// app: what you get" state, which is the starter as it ships (Settings only). In an app the tab is the app's own line in tabs.ts.

// The example's tab. The design-system page is a view of it, DEMO only: not a tab and not a route, so a new app's tab bar never shows it.
function ClientsTab() {
  const design = useDemo((s) => s.design)
  return design ? <DesignSystemScreen /> : <ClientsScreen />
}

const tabs = TABS as Tab[] // the real array, typed read-only in tabs.ts; AppShell and AppRoutes read it when they render
const STARTER_TABS: Tab[] = [...tabs]
const EXAMPLE_TABS: Tab[] = [{ to: '/clients', label: w.nav.clients, Icon: Users, Page: ClientsTab }, ...STARTER_TABS]
const showTabs = (fresh: boolean) => tabs.splice(0, tabs.length, ...(fresh ? STARTER_TABS : EXAMPLE_TABS))
showTabs(base.fresh)
// Before React draws anything (a store listener runs inside `set`), so the app drawn afresh for the state reads the right tabs.
useDemo.subscribe((state, previous) => {
  if (state.fresh !== previous.fresh) showTabs(state.fresh)
})

export default function App() {
  const frame = useDemo((s) => s.frame)
  const menuOpen = useDemo((s) => s.menuOpen)
  const applied = useDemo((s) => s.applied)
  const toast = useDemo((s) => s.toast)

  // A message the state shows goes through the real toast store, as a save that worked would; the real Toast clears it after three seconds.
  // A state without one clears what the one before left.
  useEffect(() => {
    useToastStore.getState().clear()
    if (toast) useToastStore.getState().show(toast)
  }, [applied, toast])

  const phone = frame === 'phone'
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* WIDTH → PHONE FRAME: the app in a phone-sized box on the computer's screen. Its layout follows the box's width (useWide), and its
            overlays are drawn inside it (the frame's overlay root carries the transform), so the phone layout can be seen as it would be. */}
        <div className={cx('h-full', phone && 'flex items-center justify-center bg-raised p-4')}>
          <div className={cx(phone ? 'h-full max-h-[844px] w-[390px] max-w-full overflow-hidden rounded-xl border border-wire-strong shadow-panel' : 'h-full w-full')}>
            {/* Drawn afresh for each state applied from the menu: a state never inherits what the last one left on screen. */}
            <AppRoutes key={applied} />
          </div>
        </div>
        <DemoButton />
        {menuOpen && <DemoMenu />}
      </MemoryRouter>
    </QueryClientProvider>
  )
}
