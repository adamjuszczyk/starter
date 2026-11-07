import { AlertCircle } from 'lucide-react'

// An error line inside a form or under a list: the pattern of Overload's LoginPage error line, drawn from the prototype's ui.tsx. The
// caller gives the words, a line from the words file (a reason from the server goes after it, never alone: SPEC Screens).
export function InlineError({ text }: { text: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-ghost px-3 py-2.5 text-sm text-danger">
      <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span className="min-w-0">{text}</span>
    </div>
  )
}
