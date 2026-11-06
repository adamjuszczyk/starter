// The app's identity: its name, colours, icons and language, in one place. Nothing else in the repo spells them.
// vite.config.ts reads this file for the install manifest and for index.html (title, theme colour, favicon, language), and gives it to the
// app as the define `__APP_CONFIG__`, which src/lib/appConfig.ts is the one place to read. A new app edits this file and replaces the
// three files in public/; the words the app shows live in src/i18n/, and the colours it draws with in src/styles/tokens.css.
export interface AppConfig {
  /** The page title, the installed app's name, and the name the app shows. */
  name: string
  /** The label under the icon on the home screen, where the phone has room for about twelve characters. */
  shortName: string
  /** The install manifest's description. */
  description: string
  /** The colour of the browser's and the phone's top bar. The manifest takes one colour for both themes, so a colour that suits both works best. */
  themeColor: string
  /** The splash screen's colour while the installed app opens. */
  backgroundColor: string
  /** File names in public/. `icon512` is also served as the maskable icon, so its picture stays inside the middle 80%. */
  icons: { favicon: string; icon192: string; icon512: string }
  /** The app's language as a BCP 47 tag: the page's `lang` and the manifest's. The formats (src/lib/format.ts) and the words (src/i18n/) follow it. */
  locale: string
}

const appConfig: AppConfig = {
  name: 'Starter',
  shortName: 'Starter',
  description: 'Starter',
  themeColor: '#2453bd',
  backgroundColor: '#f5f6f8',
  icons: { favicon: 'favicon.svg', icon192: 'icon-192.png', icon512: 'icon-512.png' },
  locale: 'pl',
}

export default appConfig
