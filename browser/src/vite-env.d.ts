/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DAYTONA_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 