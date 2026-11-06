import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { APP_CONFIG } from './lib/appConfig'
import { APP_VERSION } from './lib/version'
import { formatDateTime } from './lib/format'
import { useServiceWorker } from './features/pwa/useServiceWorker'
import { pl as t } from './i18n/pl'

// This chunk's App renders only what exists so far: the providers, the app's name and the build line. The app frame, sign-in and Settings
// come with their own chunks and replace it.
export default function App() {
  // The service worker's registration and its checks, once, whatever the app is showing.
  useServiceWorker()
  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="m-0 font-display text-2xl font-bold text-ink">{APP_CONFIG.name}</h1>
        <p className="num m-0 text-xs text-ink-4">{t.settings.buildLine(APP_VERSION, __BUILD_HASH__, formatDateTime(__BUILD_TIME__))}</p>
      </main>
    </QueryClientProvider>
  )
}
