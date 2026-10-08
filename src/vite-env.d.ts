/// <reference types="vite/client" />

import type { HubApi } from '../electron/preload'

declare global {
  interface Window {
    hub: HubApi
  }
}

export {}
