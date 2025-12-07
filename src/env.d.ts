/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PJT: string
  readonly VITE_MQTT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
