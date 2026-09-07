import { beforeEach, describe, expect, it } from 'vitest'
import { browserApiKeyIsPersistent, clearBrowserApiKey, getBrowserApiKey, isCerebrasKey, saveBrowserApiKey } from '../src/services/cerebras-key'

const validKey = 'csk-abcdefghijklmnopqrstuvwxyz123456'

beforeEach(() => { sessionStorage.clear(); localStorage.clear() })

describe('Cerebras browser key storage', () => {
  it('keeps keys in the current tab by default', () => {
    saveBrowserApiKey(validKey, false)
    expect(getBrowserApiKey()).toBe(validKey)
    expect(browserApiKeyIsPersistent()).toBe(false)
    expect(localStorage.length).toBe(0)
  })

  it('only persists after explicit opt-in and clears both stores', () => {
    saveBrowserApiKey(validKey, true)
    expect(getBrowserApiKey()).toBe(validKey)
    expect(browserApiKeyIsPersistent()).toBe(true)
    clearBrowserApiKey()
    expect(getBrowserApiKey()).toBeNull()
  })

  it('rejects values outside the Cerebras key format', () => {
    expect(isCerebrasKey('not-a-key')).toBe(false)
    expect(() => saveBrowserApiKey('not-a-key', false)).toThrow('INVALID_KEY')
  })
})
