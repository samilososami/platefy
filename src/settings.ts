import '@fontsource-variable/manrope'
import '@fontsource/instrument-serif/400-italic.css'
import './settings.css'

const result = document.querySelector<HTMLParagraphElement>('#api-result')!
const serverStatus = document.querySelector<HTMLSpanElement>('#server-status')!
const testButton = document.querySelector<HTMLButtonElement>('#test-connection')!

function setResult(message: string, state: 'idle' | 'working' | 'success' | 'error' = 'idle') {
  result.textContent = message
  result.dataset.state = state
}

async function checkServer() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store', credentials: 'same-origin' })
    const status = await response.json() as { configured?: boolean; model?: string; provider?: string }
    if (!response.ok) throw new Error()
    serverStatus.textContent = status.configured
      ? `${status.provider || 'Cloudflare Workers AI'} conectado · ${status.model || 'Qwen3 30B-A3B'}`
      : 'La conexión de Cloudflare todavía no está configurada en Vercel'
    document.querySelector('.api-status')?.classList.toggle('is-ready', Boolean(status.configured))
    return Boolean(status.configured)
  } catch {
    serverStatus.textContent = 'No se ha podido comprobar la conexión'
    return false
  }
}

testButton.addEventListener('click', async () => {
  testButton.disabled = true
  setResult('Consultando la carta con Qwen3…', 'working')
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', cache: 'no-store', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: [{ role: 'user', content: '¿A qué hora sirve cenas el restaurante?' }], locale: 'es', thinking: false }),
    })
    if (!response.ok) throw new Error(String(response.status))
    const body = await response.text()
    if (!body.includes('data: [DONE]')) throw new Error('invalid')
    setResult('Conexión verificada. Cloudflare Workers AI ha respondido correctamente.', 'success')
  } catch {
    setResult('No se ha podido completar la prueba de conexión.', 'error')
  } finally { testButton.disabled = false }
})

void checkServer()
