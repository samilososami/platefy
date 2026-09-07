import '@fontsource-variable/manrope'
import '@fontsource/instrument-serif/400-italic.css'
import './settings.css'
import { browserApiKeyIsPersistent, clearBrowserApiKey, getBrowserApiKey, isCerebrasKey, saveBrowserApiKey } from './services/cerebras-key'

const form = document.querySelector<HTMLFormElement>('#api-form')!
const input = document.querySelector<HTMLInputElement>('#api-key')!
const remember = document.querySelector<HTMLInputElement>('#remember-key')!
const result = document.querySelector<HTMLParagraphElement>('#api-result')!
const serverStatus = document.querySelector<HTMLSpanElement>('#server-status')!
const showButton = document.querySelector<HTMLButtonElement>('#show-key')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-key')!

function setResult(message: string, state: 'idle' | 'working' | 'success' | 'error' = 'idle') {
  result.textContent = message
  result.dataset.state = state
}

const stored = getBrowserApiKey()
if (stored) {
  input.placeholder = 'Hay una clave guardada · escribe para sustituirla'
  remember.checked = browserApiKeyIsPersistent()
}

showButton.addEventListener('click', () => {
  const visible = input.type === 'text'
  input.type = visible ? 'password' : 'text'
  showButton.textContent = visible ? 'Ver' : 'Ocultar'
  showButton.setAttribute('aria-label', visible ? 'Mostrar clave' : 'Ocultar clave')
})

clearButton.addEventListener('click', () => {
  clearBrowserApiKey()
  input.value = ''
  input.placeholder = 'csk-••••••••••••••••••••'
  remember.checked = false
  setResult('La clave del navegador se ha eliminado. Platefy usará la conexión de Vercel.', 'success')
})

async function checkServer() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store', credentials: 'same-origin' })
    const status = await response.json() as { configured?: boolean; model?: string }
    if (!response.ok) throw new Error()
    serverStatus.textContent = status.configured
      ? `Vercel conectado · ${status.model || 'gpt-oss-120b'}`
      : 'Vercel todavía no tiene una clave configurada'
    document.querySelector('.api-status')?.classList.toggle('is-ready', Boolean(status.configured))
  } catch {
    serverStatus.textContent = 'No se ha podido comprobar la conexión'
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault()
  const typed = input.value.trim()
  const key = typed || getBrowserApiKey()
  if (!key) { setResult('Escribe una clave o utiliza la conexión de Vercel.', 'error'); return }
  if (!isCerebrasKey(key)) { setResult('La clave no tiene el formato esperado de Cerebras.', 'error'); return }
  if (typed) {
    try { saveBrowserApiKey(typed, remember.checked) } catch { setResult('El navegador no ha permitido guardar la clave.', 'error'); return }
  }
  setResult('Probando GPT‑OSS 120B con la carta de muestra…', 'working')
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', cache: 'no-store', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: [{ role: 'user', content: '¿A qué hora sirve cenas el restaurante?' }], locale: 'es', thinking: false, apiKey: key }),
    })
    if (!response.ok) throw new Error(String(response.status))
    await response.body?.cancel()
    input.value = ''
    input.placeholder = 'Hay una clave guardada · escribe para sustituirla'
    setResult('Conexión verificada. Cerebras ha respondido correctamente.', 'success')
  } catch (error) {
    const status = error instanceof Error ? Number(error.message) : 0
    setResult(status === 401 ? 'Cerebras ha rechazado la clave.' : status === 429 ? 'La cuota está ocupada. Espera un minuto y vuelve a probar.' : 'No se ha podido completar la prueba.', 'error')
  }
})

void checkServer()
