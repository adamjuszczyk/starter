import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Desktop or phone layout, chosen by the app's own width, not the window's
// (decided 2026-11-06): the same code then works inside the prototype's phone
// frame and on a real phone. 900 px: a tablet held upright gets the phone layout.
export const WIDE_FROM = 900

const WideContext = createContext(true)
export const useWide = () => useContext(WideContext)

export function WidthRoot({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(true)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWide(el.clientWidth >= WIDE_FROM)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} data-layout={wide ? 'desktop' : 'phone'}>
      <WideContext.Provider value={wide}>{children}</WideContext.Provider>
    </div>
  )
}
