import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { WidthRoot } from './lib/useWide'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useServiceWorker } from './features/pwa/useServiceWorker'
import { AuthProvider, useAuth } from './features/auth/useAuth'
import LoginPage from './features/auth/LoginPage'
import { useTheme } from './features/settings/useTheme'
import { OfflineStrip } from './components/OfflineStrip'
import { Toast } from './components/Toast'
import { AppShell } from './shell/AppShell'
import { TABS } from './shell/tabs'
import { pl as t } from './i18n/pl'

// The app: the providers, then the routes. Overload's shape (AuthProvider, BrowserRouter, an exported AppRoutes), without its gates, sync
// queue and screens.
export default function App() {
  // The service worker's registration and its update checks, once, here, whatever the app is showing: a registration that lived in a screen
  // would be gone when that screen was. Nothing is drawn (the app has no update screen: a new version installs in the background and is used
  // the next time the app opens).
  useServiceWorker()
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* The frame is the window: AppRoutes' frame fills whatever box it is given, and here that is the whole dynamic viewport. */}
          <div className="h-dvh">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

// The loading state before the session is known (Overload's spinner, through tokens): a signed-in person never sees the sign-in page flash.
function Spinner() {
  return (
    <div aria-busy="true" className="flex h-full items-center justify-center bg-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-wire-strong border-t-ink" />
    </div>
  )
}

// Exported so App.test.tsx can mount the real route table under its own MemoryRouter, as Overload's does: the same routes App() wires under
// BrowserRouter, without the providers' side effects. The prototype kit mounts it the same way (TASKS.md, Decided 3).
export function AppRoutes() {
  const { user, loading } = useAuth()
  const online = useOnlineStatus()
  // The theme is applied here, above everything below that returns (the spinner, the sign-in page, the app), so every one of them wears it.
  useTheme()

  // The frame is the first thing drawn, above the signed-in and the signed-out pages alike (Decided 45): the sign-in page gets the phone
  // layout on a phone, with its 44 px controls, from the width of this box.
  return (
    <WidthRoot className="relative isolate h-full w-full overflow-hidden bg-bg">
      {loading ? (
        <Spinner />
      ) : !user ? (
        // Signed out: the sign-in page on every path. A person who opened /settings lands on it once signed in.
        <LoginPage />
      ) : (
        <AppShell banner={online ? null : <OfflineStrip text={t.common.offline} />}>
          <Routes>
            {TABS.map(({ to, Page }) => (
              <Route key={to} path={to} element={<Page />} />
            ))}
            {/* `/` and any path that is no tab's go to the first tab. */}
            <Route path="*" element={<Navigate to={TABS[0].to} replace />} />
          </Routes>
        </AppShell>
      )}
      {/* The toast, once, for the whole app (DECISIONS 70): it draws into this frame's overlay root, so it is above whatever page is showing, a
          panel and a dialog included, and anything can show a message through the store (src/features/notifications/toastStore.ts). */}
      <Toast />
    </WidthRoot>
  )
}
