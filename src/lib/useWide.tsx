import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Desktop or phone layout, chosen by the app's own width, not the window's (SPEC item 1): a tablet held upright gets the phone layout, and
// the same code works inside the prototype kit's phone frame and on a real phone. Lifted from the prototype's WidthRoot. 900 px is the
// switch: at 900 and above the layout is the desktop's.
export const WIDE_FROM = 900

interface Frame {
  wide: boolean
  /** The frame's own element, which an overlay is drawn into (see `WidthRoot`). Null until the frame is on the page. */
  overlayRoot: HTMLElement | null
}

// Outside a WidthRoot the layout is the desktop's, as in the prototype: a component drawn on its own (in a test, say) has no frame to measure.
const FrameContext = createContext<Frame>({ wide: true, overlayRoot: null })

/** Whether the app is drawn at its desktop width (900 px and above), measured on the nearest `WidthRoot`. */
export const useWide = (): boolean => useContext(FrameContext).wide

/**
 * The element a panel, a dialog or a toast is drawn into: the frame's own, not `document.body` (TASKS.md, Decided 6). It carries
 * `transform: translateZ(0)`, which makes it the containing block of a `position: fixed` child, so an overlay stays inside the frame
 * (the kit's phone frame) and, in the real app, where the frame is the window, nothing changes. Null until the frame is on the page, so a
 * component that portals into it draws nothing on its very first render.
 */
export const useOverlayRoot = (): HTMLElement | null => useContext(FrameContext).overlayRoot

/**
 * The app's frame: the box whose width decides the layout (`data-layout` is `desktop` or `phone`), and inside it the element overlays are
 * drawn into. It sits at the top of `AppRoutes` (TASKS.md, Decided 45), above the signed-in and signed-out pages alike, so the sign-in page
 * gets the phone layout too. The caller gives the box its size and look through `className`.
 */
export function WidthRoot({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null)
  const [wide, setWide] = useState(true)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWide(el.clientWidth >= WIDE_FROM)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const frame = useMemo<Frame>(() => ({ wide, overlayRoot }), [wide, overlayRoot])
  return (
    <div ref={ref} className={className} data-layout={wide ? 'desktop' : 'phone'}>
      <div ref={setOverlayRoot} className="h-full" style={{ transform: 'translateZ(0)' }}>
        <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>
      </div>
    </div>
  )
}
