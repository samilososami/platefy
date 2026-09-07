const SESSION_KEY = 'platefy:cerebras-key:session'
const PERSISTENT_KEY = 'platefy:cerebras-key:persistent'

export function isCerebrasKey(value: string): boolean { return /^csk-[A-Za-z0-9_-]{24,}$/.test(value.trim()) }

export function getBrowserApiKey(): string | null {
  try { return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(PERSISTENT_KEY) } catch { return null }
}

export function saveBrowserApiKey(value: string, remember: boolean) {
  const key = value.trim()
  if (!isCerebrasKey(key)) throw new Error('INVALID_KEY')
  try {
    sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(PERSISTENT_KEY)
    ;(remember ? localStorage : sessionStorage).setItem(remember ? PERSISTENT_KEY : SESSION_KEY, key)
  } catch { throw new Error('STORAGE_UNAVAILABLE') }
}

export function clearBrowserApiKey() {
  try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(PERSISTENT_KEY) } catch { /* Storage may be disabled. */ }
}

export function browserApiKeyIsPersistent(): boolean {
  try { return Boolean(localStorage.getItem(PERSISTENT_KEY)) } catch { return false }
}
