import type { useOnlineStatus as RealUseOnlineStatus } from '@app/hooks/useOnlineStatus'
import { useDemo } from '../demo/demoStore'

// Whether the device has a connection: what the DEMO menu says, so the real offline strip, the real sign-in and the example's Save can be seen
// without switching the computer's network off. Lifted from Overload's prototype/src/fakes/useOnlineStatus.ts.
export const useOnlineStatus: typeof RealUseOnlineStatus = () => useDemo((s) => s.online)
