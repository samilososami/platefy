import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ALLERGEN_IDS, excludedAllergens, filterMenu, getGroundedContext, isRestaurantSlug, restaurantMenuPath, safeDishImage, type RestaurantSlug, type RestaurantMenu, type MenuFilterResult, type DishImage, type MenuDish } from '../src/services/restaurant.js'

export { filterMenu } from '../src/services/restaurant.js'

type Request = IncomingMessage & { body?: unknown }
type Response = ServerResponse & { status(code: number): Response; json(value: unknown): void }
type Message = { role: 'user' | 'assistant'; content: string }
type CloudflareResult = { content?: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; neurons?: number }; model?: string; error?: string; detail?: string }

const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'
const windows = new Map<string, { started: number; count: number }>()
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }
function locale(value: unknown) { const code = typeof value === 'string' ? value.toLowerCase().split('-')[0] : 'es'; return code === 'en' || code === 'ca' ? code : 'es' }

function priorUserQuestions(messages: Message[], allergies: string[] = []) {
  return [...messages.slice(0, -1).filter(message => message.role === 'user').map(message => message.content),
    ...(allergies.length ? [`sin ${allergies.map(value => value.replace(/_/g, ' ')).join(' y ')}`] : [])]
}

type ImageSelection = { images: DishImage[]; missing: MenuDish[]; blocked: MenuDish[]; exclusions: string[]; filter: MenuFilterResult }
/** Photos come from menu records, never from model-generated URLs. */
function imageSelection(menu: RestaurantMenu, messages: Message[], slug: RestaurantSlug, allergies: string[] = []): ImageSelection | null {
  const question = normalize(messages[messages.length - 1].content)
  if (!/\bfoto|\bimagen|como (?:se ve|luce)|\b(?:photo|picture|image|look like)|com (?:es veu|son)|\bmostra.?m|\bensena/.test(question)) return null
  const prior = priorUserQuestions(messages, allergies)
  const filter = filterMenu(menu, question, prior)
  const allowed = new Set(filter.dishes.map(dish => dish.id))
  const exclusions = [...new Set([...prior.flatMap(excludedAllergens), ...excludedAllergens(question)])]
  const previous = messages.slice(0, -1).reverse().find(message => message.role === 'assistant')?.content || ''
  const available = menu.platos.filter(dish => dish.disponible)
  const directNames = available.filter(dish => question.includes(normalize(dish.nombre)))
  const terms = question.split(/[^a-z0-9]+/).filter(word => word.length >= 4 && !['como', 'foto', 'fotos', 'imagen', 'imagenes', 'quiero', 'tienes', 'tenemos', 'puedes', 'muestra', 'muestrame', 'ensenar', 'ensena', 'ensename', 'verlas', 'verlos', 'carta', 'menu', 'plato', 'platos', 'photo', 'photos', 'picture', 'pictures', 'image', 'images', 'show', 'looks', 'like', 'please', 'would', 'could', 'algo', 'hasta', 'menos', 'euros', 'alergico', 'alergica'].includes(word)
    && !excludedAllergens(`sin ${word}`).some(allergen => exclusions.includes(allergen)))
  const named = directNames.length ? directNames : available.filter(dish => terms.some(term => normalize([dish.nombre, ...dish.ingredientes].join(' ')).includes(term)))
  const referenced = named.length ? named : terms.length ? [] : available.filter(dish => normalize(previous).includes(normalize(dish.nombre)))
  const requested = referenced.length ? referenced : !terms.length && filter.applied.length ? filter.dishes : []
  const compatible = requested.filter(dish => allowed.has(dish.id))
  return {
    images: compatible.map(dish => safeDishImage(dish, slug)).filter((image): image is DishImage => image !== null).slice(0, 3),
    missing: compatible.filter(dish => !safeDishImage(dish, slug)).slice(0, 3),
    blocked: requested.filter(dish => !allowed.has(dish.id)).slice(0, 3), exclusions, filter,
  }
}
export function menuImages(menu: RestaurantMenu, messages: Message[], slug: RestaurantSlug): DishImage[] | null {
  return imageSelection(menu, messages, slug)?.images ?? null
}

/** Attach only menu-owned photos for dishes the verified answer actually names. */
export function answerImages(menu: RestaurantMenu, answer: string, slug: RestaurantSlug): DishImage[] {
  const output = normalize(answer)
  return menu.platos
    .filter(dish => dish.disponible && output.includes(normalize(dish.nombre)))
    .map(dish => safeDishImage(dish, slug))
    .filter((image): image is DishImage => image !== null)
    .slice(0, 2)
}

function streamAnswer(response: Response, answer: string, images: DishImage[] = [], result?: CloudflareResult, providerMs?: number) {
  response.statusCode = 200; response.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); response.setHeader('X-Accel-Buffering', 'no')
  for (const content of answer.match(/[\s\S]{1,180}/g) || [answer]) response.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
  response.write(`data: ${JSON.stringify({ choices: [{ delta: {} }], platefy_images: images, usage: result?.usage, platefy_metrics: { provider_first_token_ms: providerMs ?? null, neurons: result?.usage?.neurons ?? null } })}\n\n`)
  return response.end('data: [DONE]\n\n')
}

function clientIp(request: Request) { const value = request.headers['x-forwarded-for']; return (Array.isArray(value) ? value[0] : value?.split(',')[0])?.trim() || request.socket.remoteAddress || 'unknown' }
function withinLimit(request: Request) { const key = clientIp(request); const now = Date.now(); const current = windows.get(key); if (!current || now - current.started >= 60_000) { windows.set(key, { started: now, count: 1 }); return true } current.count += 1; return current.count <= 10 }
function originAllowed(request: Request) {
  const origin = request.headers.origin
  if (!origin) return true
  try { const url = new URL(origin); return (url.protocol === 'https:' && (url.hostname === 'platefy.samilososami.com' || url.hostname.endsWith('.vercel.app'))) || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) } catch { return false }
}
function readBody(request: Request): Promise<unknown> {
  if (request.body !== undefined) return Promise.resolve(request.body)
  return new Promise((resolve, reject) => { let raw = ''; request.setEncoding('utf8'); request.on('data', chunk => { raw += chunk; if (raw.length > 32_000) reject(new Error('PAYLOAD_TOO_LARGE')) }); request.on('end', () => { try { resolve(JSON.parse(raw)) } catch { reject(new Error('INVALID_JSON')) } }); request.on('error', reject) })
}
function sanitize(value: unknown): { messages: Message[]; locale: string; restaurant: RestaurantSlug; allergies: string[] } {
  if (!value || typeof value !== 'object') throw new Error('INVALID_PAYLOAD')
  const body = value as { messages?: unknown; locale?: unknown; restaurant?: unknown; allergies?: unknown }
  if (!isRestaurantSlug(body.restaurant)) throw new Error('INVALID_RESTAURANT')
  if (body.allergies !== undefined && (!Array.isArray(body.allergies) || body.allergies.length > ALLERGEN_IDS.length || body.allergies.some(value => typeof value !== 'string' || !ALLERGEN_IDS.includes(value)))) throw new Error('INVALID_PAYLOAD')
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 7) throw new Error('INVALID_MESSAGES')
  const messages = body.messages.map(message => {
    if (!message || typeof message !== 'object') throw new Error('INVALID_MESSAGE')
    const candidate = message as { role?: unknown; content?: unknown }
    if ((candidate.role !== 'user' && candidate.role !== 'assistant') || typeof candidate.content !== 'string') throw new Error('INVALID_MESSAGE')
    const content = candidate.content.trim(); if (!content || content.length > 1600) throw new Error('INVALID_MESSAGE')
    return { role: candidate.role as Message['role'], content }
  })
  if (messages[messages.length - 1].role !== 'user') throw new Error('INVALID_MESSAGES')
  return { messages, locale: locale(body.locale), restaurant: body.restaurant, allergies: (body.allergies || []) as string[] }
}
function sources(slug: RestaurantSlug) {
  // The allowlist is checked before constructing a path; client content never becomes a knowledge file.
  const directory = path.join(process.cwd(), 'public')
  const identity = readFileSync(path.join(directory, 'platefy.md'), 'utf8').trim()
  const menu = JSON.parse(readFileSync(path.join(directory, restaurantMenuPath(slug).slice(1)), 'utf8')) as RestaurantMenu
  if (!identity || menu.restaurante?.slug !== slug || !Array.isArray(menu.platos)) throw new Error('KNOWLEDGE_INVALID')
  return { identity, menu }
}
/** Remove invented or excessive dishes from Markdown recommendation lists. */
export function verifiedRecommendationList(answer: string, allowedDishes: MenuDish[]) {
  const allowed = new Set(allowedDishes.map(dish => normalize(dish.nombre)))
  let listItems = 0
  return answer.split('\n').filter(line => {
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(?:\*\*)?(.+?)(?:\*\*)?\s+[—–-]\s+/)
    if (!item) return true
    if (!allowed.has(normalize(item[1].trim()))) return false
    listItems += 1
    return listItems <= 4
  }).join('\n').trim()
}
function validateAnswer(answer: string, filter: MenuFilterResult, menu: RestaurantMenu, language: string) {
  const stripped = answer.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/gi, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim()
  const allowed = filter.applied.length ? filter.dishes : menu.platos
  const clean = verifiedRecommendationList(stripped, allowed)
  if (!clean || clean.length > 12_000) throw new Error('INVALID_MODEL_RESPONSE')
  if (filter.applied.length) {
    const allowed = new Set(filter.dishes.map(dish => dish.id)); const output = normalize(clean)
    if (menu.platos.some(dish => output.includes(normalize(dish.nombre)) && !allowed.has(dish.id))) throw new Error('UNGROUNDED_DISH')
  }
  return ensureAllergyNotice(clean, filter, language)
}
function ensureAllergyNotice(answer: string, filter: MenuFilterResult, language: string) {
  if (!filter.isSafetyQuestion || /(?:confirm|consulta|check)[\s\S]{0,100}(?:personal|equipo|restaurant|staff|team)/i.test(answer)) return answer
  return answer + (language === 'en' ? '\n\nPlease confirm ingredients, traces and cross-contamination with the restaurant team.' : language === 'ca' ? '\n\nConfirma els ingredients, les traces i la contaminació creuada amb l’equip del restaurant.' : '\n\nConfirma los ingredientes, las trazas y la contaminación cruzada con el equipo del restaurante.')
}

function upstreamError(status: number, detail = '') {
  if (status === 401 || status === 403) return { status: 503, message: 'The assistant connection requires attention.', reason: 'authentication' }
  if (status === 429 || /neuron|quota|limit/i.test(detail)) return { status: 429, message: 'The assistant has reached its available quota.', reason: 'quota_unavailable' }
  return { status: 503, message: 'The assistant is temporarily unavailable.', reason: 'provider' }
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0'); response.setHeader('X-Content-Type-Options', 'nosniff')
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return response.status(405).json({ error: 'Method not allowed.' }) }
  if (!originAllowed(request)) return response.status(403).json({ error: 'Origin not allowed.' })
  if (!withinLimit(request)) return response.status(429).json({ error: 'Too many requests. Please wait a minute.' })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const payload = sanitize(await readBody(request))
    const knowledge = sources(payload.restaurant)
    const question = payload.messages[payload.messages.length - 1].content
    const photos = imageSelection(knowledge.menu, payload.messages, payload.restaurant, payload.allergies)
    if (photos !== null) {
      const images = photos.images
      const names = images.map(image => image.nombre).join(', ')
      let answer = images.length
        ? payload.locale === 'en' ? `Here ${images.length === 1 ? 'is' : 'are'} ${names}.` : payload.locale === 'ca' ? `Aquí tens ${names}.` : `Aquí tienes ${names}.`
        : payload.locale === 'en' ? 'Which dish would you like to see? Tell me its name and I’ll check whether its photo is available on this menu.' : payload.locale === 'ca' ? 'Quin plat t’agradaria veure? Digues-me el nom i comprovaré si té fotografia en aquesta carta.' : '¿Qué plato te gustaría ver? Dime su nombre y comprobaré si tiene fotografía en esta carta.'
      if (photos.blocked.length) {
        const labels: Record<string, string> = { frutos_de_cascara: 'frutos de cáscara', leche: 'leche', huevo: 'huevo', pescado: 'pescado', crustaceos: 'crustáceos', moluscos: 'moluscos', sesamo: 'sésamo', altramuces: 'altramuces' }
        const reasons = photos.blocked.map(dish => {
          const allergens = dish.alergenos.filter(value => photos.exclusions.includes(value)).map(value => labels[value] || value)
          return allergens.length ? `${dish.nombre} (${allergens.join(', ')})` : dish.nombre
        }).join('; ')
        const warning = payload.locale === 'en' ? `I cannot present these dishes as compatible with your restrictions: ${reasons}.` : payload.locale === 'ca' ? `No et presento aquests plats com a compatibles amb les teves restriccions: ${reasons}.` : `No te presento estos platos como compatibles con tus restricciones: ${reasons}.`
        answer = images.length ? answer + '\n\n' + warning : warning
      } else if (!images.length && photos.missing.length) {
        const missing = photos.missing.map(dish => dish.nombre).join(', ')
        answer = payload.locale === 'en' ? `We don't have a photo of ${missing} yet.` : payload.locale === 'ca' ? `Encara no tenim fotografia de ${missing}.` : `Todavía no tenemos fotografía de ${missing}.`
      }
      if (images.length && /precio|cuanto|cuesta|cost|price|lleva|ingrediente|porta/.test(normalize(question))) {
        const money = new Intl.NumberFormat(payload.locale, { style: 'currency', currency: knowledge.menu.restaurante.moneda })
        answer += '\n\n' + images.map(image => {
          const dish = knowledge.menu.platos.find(candidate => candidate.id === image.id)!
          return `${dish.nombre} · ${money.format(dish.precio)}. ${dish.descripcion}`
        }).join('\n\n')
      }
      return streamAnswer(response, ensureAllergyNotice(answer, photos.filter, payload.locale), images)
    }
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL
    const workerSecret = process.env.CLOUDFLARE_WORKER_SECRET
    if (!workerUrl || !workerSecret) return response.status(503).json({ error: 'The assistant connection is not configured.' })
    const grounded = getGroundedContext(knowledge, question, priorUserQuestions(payload.messages, payload.allergies))
    const controller = new AbortController(); timeout = setTimeout(() => controller.abort(), 25_000)
    request.once('close', () => { if (!request.complete) controller.abort() })
    const upstreamStarted = performance.now()
    const upstream = await fetch(workerUrl, {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${workerSecret}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: grounded.system }, ...payload.messages.slice(0, -1), { role: 'user', content: question }], thinking: false }),
    })
    if (!upstream.ok) { const error = upstreamError(upstream.status, await upstream.text()); return response.status(error.status).json({ error: error.message, reason: error.reason }) }
    const result = await upstream.json() as CloudflareResult
    const verified = validateAnswer(result.content || '', grounded.filter, knowledge.menu, payload.locale)
    const images = answerImages(knowledge.menu, verified, payload.restaurant)
    const providerMs = performance.now() - upstreamStarted
    return streamAnswer(response, verified, images, result, providerMs)
  } catch (error) {
    if (response.headersSent) return response.end()
    const message = error instanceof Error ? error.message : ''
    if (message === 'PAYLOAD_TOO_LARGE') return response.status(413).json({ error: 'Request too large.' })
    if (/INVALID_(JSON|PAYLOAD|MESSAGES?|RESTAURANT)/.test(message)) return response.status(400).json({ error: 'Invalid request.' })
    if (message === 'UNGROUNDED_DISH' || message === 'INVALID_MODEL_RESPONSE') return response.status(422).json({ error: 'The answer did not pass menu verification.' })
    if (error instanceof DOMException && error.name === 'AbortError') return response.status(504).json({ error: 'The assistant took too long to respond.' })
    return response.status(500).json({ error: 'The request could not be completed.' })
  } finally { if (timeout) clearTimeout(timeout) }
}
