import { WifiOff } from 'lucide-react'

// The strip at the top of the app's content while the device has no connection. Lifted from Overload's Nav.tsx (which drew it above the tab
// bar) and moved to the top of the content, as the prototype has it. The caller gives the words: `t.common.offline`.
export function OfflineStrip({ text }: { text: string }) {
  return (
    <div role="status" className="flex items-center gap-2 border-b border-wire bg-warn-ghost px-4 py-2 text-sm text-warn">
      <WifiOff size={15} aria-hidden className="shrink-0" />
      <span className="min-w-0">{text}</span>
    </div>
  )
}
