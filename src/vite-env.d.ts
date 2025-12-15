/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string
  readonly VITE_APP_API_WEBSOCKETS: string
  readonly VITE_APP_APOLLO_URL: string
  readonly VITE_APP_BUCKET_URL: string
  readonly VITE_APP_CDN_URL: string
  readonly VITE_APP_CDN_URL_SHORT: string
  readonly VITE_APP_DASHBOARD_URL: string
  readonly VITE_APP_EDITOR_DEV_URL: string
  readonly VITE_APP_EDITOR_URL: string
  readonly VITE_APP_ENV_MODE: string
  readonly VITE_APP_HOSTNAME: string
  readonly VITE_APP_IS_EDITOR_DEV: string
  readonly VITE_APP_PLUGINS_URL: string
  readonly VITE_APP_PREVIEW_URL: string
  readonly VITE_APP_SEGMENT_KEY: string
  readonly VITE_APP_STRIPE_PUBLIC_KEY: string
  readonly VITE_APP_USERFLOW_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}