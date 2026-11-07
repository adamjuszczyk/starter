import type { ComponentType } from 'react'
import { Settings, type LucideIcon } from 'lucide-react'
import SettingsPage from '../features/settings/SettingsPage'
import { pl as t } from '../i18n/pl'

// The app's tabs: where each lives, what it is called, its icon (the tab bar and the side menu draw them) and the page it opens. The
// starter has Settings only (TASKS.md, Decided 25): the tabs are each app's own, and a build that adds a screen adds its tab here, which is
// the one place for it. `/` and any path that is no tab's go to the first tab (App.tsx).
export interface Tab {
  to: string
  label: string
  Icon: LucideIcon
  Page: ComponentType
}

export const TABS: readonly Tab[] = [{ to: '/settings', label: t.nav.settings, Icon: Settings, Page: SettingsPage }]
