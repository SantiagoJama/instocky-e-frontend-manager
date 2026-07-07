export const env = {
  apiBaseUrl: import.meta.env.VITE_API as string | undefined,
}

export function getApiBaseUrl() {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API no esta configurada en el archivo .env')
  }

  return env.apiBaseUrl
}
