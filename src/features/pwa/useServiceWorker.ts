import { useEffect, useState } from 'react'
import { useRegisterSW } from './pwaRegister'

// The service worker's registration, its fallback, the hourly check and the foreground check, and nothing drawn: the app has no update
// screen. A new version installs in the background and is used the next time the app opens. What an update screen would need (the
// registration, and that a worker newer than this page's code has taken over) is kept in a record, `serviceWorkerRecord`, for an app that
// adds one to read when its button is pressed; nothing in the starter reads it yet.
//
// It is called ONCE, in `App()`, whatever the app is showing: a registration that lived in a screen would be gone when that screen was.
//
// Structural gap this closes: `registerType: 'autoUpdate'` with skipWaiting + clientsClaim (vite.config.ts) makes the generated sw.js take
// over every open tab without being asked, so a new service worker installs and takes control on its own, but nothing in the app
// imported the client-side registration module that actually drives that lifecycle (checking for a new sw.js, reacting once one takes over).
// Without it an already-open session never re-checks, and the tab keeps running whatever JS it loaded with, however many deploys land meanwhile.
//
// registration.update() only re-fetches /sw.js and byte-compares it against the installed one: it never touches app data or Supabase, so running it
// on an interval and again on visibilitychange doesn't conflict with queryClient.ts's deliberate `refetchOnWindowFocus: false` (that is about not
// refetching data on every return to the app; this is an asset-bundle check, a different axis).
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/** What the app knows of its service worker: where it is registered, and whether a worker newer than this page's code is already running. */
export interface ServiceWorkerRecord {
  registration: ServiceWorkerRegistration | undefined
  /** A new worker has installed, activated and claimed this page since it loaded: a reload is served by it from the first byte. */
  newWorkerActive: boolean
}

let record: ServiceWorkerRecord = { registration: undefined, newWorkerActive: false }

/** The record as it stands now. Read when it is needed, never copied into state. */
export function serviceWorkerRecord(): ServiceWorkerRecord {
  return record
}

export function recordRegistration(registration: ServiceWorkerRegistration): void {
  record = { ...record, registration }
}

export function recordNewWorkerActive(): void {
  record = { ...record, newWorkerActive: true }
}

/** For tests: a new run of the app knows nothing of its worker yet. */
export function resetServiceWorkerRecord(): void {
  record = { registration: undefined, newWorkerActive: false }
}

export function useServiceWorker(): void {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>()

  useRegisterSW({
    // autoUpdate mode fires `onNeedReload` (not `onNeedRefresh`, the 'prompt'-mode-only callback) once the new worker has fully activated and
    // claimed every open client: the new worker is already controlling this page by the time this fires. Left unhandled, the library's own default
    // is a silent `window.location.reload()` (its client reloads the moment a new worker activates when no handler is given), which could
    // interrupt a person mid-edit, so this callback is required. It only records that a newer worker is running; nothing is shown, and nothing
    // reloads: the new version is used the next time the app opens. useServiceWorker.test.tsx is the standing proof.
    onNeedReload() {
      recordNewWorkerActive()
    },
    onRegisteredSW(_swUrl, reg) {
      if (reg) recordRegistration(reg)
      setRegistration(reg)
    },
    // The rich registration path (workbox-window, imported dynamically by the virtual module) can fail to even load (a strict CSP, an ad-blocker
    // treating a lazily-fetched chunk as suspicious, a transient network blip on first paint), and register()'s own source returns immediately on
    // that failure with no retry. Left alone, that is a silent, permanent "no service worker at all" for the tab. One
    // bare navigator.serviceWorker.register() fallback restores basic offline/installable capability the same way the old auto-injected
    // registerSW.js used to; it can't restore rich update-detection (`onNeedReload`), since that needs workbox-window, the piece that failed to
    // load. Its registration is recorded too, but it gets no hourly check of its own.
    onRegisterError(error) {
      console.error('[pwa] service worker registration failed, falling back to bare registration', error)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            recordRegistration(reg)
          })
          .catch((fallbackError) => {
            console.error('[pwa] fallback service worker registration also failed', fallbackError)
          })
      }
    },
  })

  // The hourly check, and one whenever the app comes back to the foreground.
  useEffect(() => {
    if (!registration) return
    const check = () => {
      registration.update().catch(() => {})
    }
    const interval = setInterval(check, UPDATE_CHECK_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [registration])
}
