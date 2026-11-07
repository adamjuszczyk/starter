// Stands in for vite-plugin-pwa's virtual module `virtual:pwa-register/react`, which vite.config.ts aliases here. The real App.tsx reaches it
// through src/features/pwa/pwaRegister.ts, and the module exists only under the app's own plugin pipeline. The kit renders AppRoutes and never
// App(), so nothing calls this; it is here so that the import resolves.
export function useRegisterSW(): void {}
