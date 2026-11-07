import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'
import { useToastStore } from '../features/notifications/toastStore'
import { cx } from '../lib/cx'
import { useOverlayRoot } from '../lib/useWide'
import { overlayMarker } from './overlay'

// The message that confirms something ("Zapisano"), at the bottom of the app for 3 seconds. The timing is Overload's Toast.tsx (it clears itself
// 3 seconds after the message appears; a new message starts the 3 seconds again); the look is the prototype's: a dark pill with a tick.
// Mount it once, under the app's frame; anything can show a message through the store (src/features/notifications/toastStore.ts).
//
// Drawn into the frame's overlay root, not fixed to the window as Overload's was: the kit's phone frame needs it inside, and in the real app
// the frame is the window. It carries the overlay marker like every overlay, and is the passive one: it never takes focus, owns no key and
// takes no touch (`pointer-events-none`: the tab bar under it still works), so a panel under it keeps its Escape. One layer above panels and
// dialogs, so it stays readable over them.
const LAYER = ['pointer-events-none', 'fixed', 'inset-x-0', 'bottom-6', 'z-50', 'flex', 'justify-center', 'px-4', 'pb-[env(safe-area-inset-bottom,0px)]']
const PILL = ['flex', 'items-center', 'gap-2', 'rounded-full', 'bg-ink', 'px-4', 'py-2.5', 'text-sm', 'font-semibold', 'text-bg', 'shadow-panel']

export function Toast() {
  const message = useToastStore((s) => s.message)
  const clear = useToastStore((s) => s.clear)
  const overlayRoot = useOverlayRoot()

  useEffect(() => {
    if (!message) return
    const id = setTimeout(clear, 3000)
    return () => clearTimeout(id)
  }, [message, clear])

  if (!message || !overlayRoot) return null
  return createPortal(
    <div role="status" {...overlayMarker('toast')} className={cx(LAYER)}>
      <div className={cx(PILL)}>
        <CheckCircle2 size={16} aria-hidden="true" /> {message}
      </div>
    </div>,
    overlayRoot,
  )
}
