import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ALLERGEN_IDS, buildGroupBudgetPlan, classifyRestaurantIntent, excludedAllergens, filterMenu, formatGroupBudgetPlan, getGroundedContext, isRestaurantSlug, restaurantLocale, restaurantMenuPath, safeDishImage, type RestaurantSlug, type RestaurantMenu, type MenuFilterResult, type DishImage, type MenuDish } from '../src/services/restaurant.js'

export { filterMenu } from '../src/services/restaurant.js'

type Request = IncomingMessage & { body?: unknown }
type Response = ServerResponse & { status(code: number): Response; json(value: unknown): void; flushHeaders?(): void }
type Message = { role: 'user' | 'assistant'; content: string }
type GatewayResult = {
  choices?: Array<{ delta?: { content?: string } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  model?: string
  error?: string | { message?: string }
  detail?: string
}

const MODEL = 'google/gemini-2.5-flash'
const FALLBACK_MODELS = ['google/gemini-2.5-flash-lite', 'openai/gpt-oss-120b'] as const
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions'
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

function streamAnswer(response: Response, answer: string, images: DishImage[] = [], result?: GatewayResult, providerMs?: number) {
  response.statusCode = 200; response.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); response.setHeader('X-Accel-Buffering', 'no'); response.flushHeaders?.()
  for (const content of answer.match(/[\s\S]{1,180}/g) || [answer]) response.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
  response.write(`data: ${JSON.stringify({ choices: [{ delta: {} }], platefy_images: images, usage: result?.usage, platefy_metrics: { provider_first_token_ms: providerMs ?? null } })}\n\n`)
  return response.end('data: [DONE]\n\n')
}

function conversationalReply(menu: RestaurantMenu, language: string, intent: 'greeting' | 'off-topic') {
  const name = menu.restaurante.nombre
  const featured = menu.platos.find(dish => dish.disponible && /edamame|brav|tomate|croquet/.test(normalize(dish.nombre)))
    || menu.platos.find(dish => dish.disponible && dish.categoria !== 'bebida')
  if (intent === 'greeting') {
    if (language === 'en') return `Hello! Welcome to ${name}. I know this menu down to the last ingredient: I can recommend dishes, work to a budget or check allergens. What are you in the mood for?`
    if (language === 'ca') return `Hola! Benvingut a ${name}. Conec aquesta carta fins a l’últim ingredient: puc recomanar-te plats, ajustar un pressupost o revisar al·lèrgens. Què et ve de gust?`
    return `¡Hola! Bienvenido a ${name}. Conozco esta carta hasta el último ingrediente: puedo recomendarte platos, ajustar un presupuesto o revisar alérgenos. ¿Qué te apetece?`
  }
  if (!featured) return language === 'en' ? `That is beyond my menu expertise, but I can help you choose what to eat at ${name}.`
    : language === 'ca' ? `Això em queda fora de carta, però sí que puc ajudar-te a triar què menjar a ${name}.`
      : `Eso me pilla fuera de carta, pero sí puedo ayudarte a elegir qué comer en ${name}.`
  if (language === 'en') return `That is beyond my menu expertise — my history degree is still in the kitchen. I can tell you about **${featured.nombre}**, though: ${featured.descripcion} Want a recommendation?`
  if (language === 'ca') return `Això em queda fora de carta — el meu títol d’història encara és a cuina. Però sí que et puc parlar de **${featured.nombre}**: ${featured.descripcion} Vols una recomanació?`
  return `Eso me pilla fuera de carta — mi título de Historia sigue en cocina. Pero sí puedo hablarte de **${featured.nombre}**: ${featured.descripcion} ¿Te recomiendo algo?`
}

/** Keep history only for turns that explicitly depend on it. */
function gatewayMessages(messages: Message[]): Message[] {
  const current = normalize(messages[messages.length - 1].content).trim()
  const contextual = /^(?:y\b|pero\b|ademas\b|tambien\b|entonces\b|eso\b|esa\b|ese\b|estos?\b|estas?\b|otra?\b|mejor\b|cual de|cuanto cuesta|que lleva|como se ve|what about|and\b|but\b|that\b|those\b|another\b|which one|how much|what does it|i si\b|pero\b|aixo\b|aquest|aquesta|una altra|quant costa|que porta)/.test(current)
  return contextual ? messages.slice(-5) : [messages[messages.length - 1]]
}

async function streamGateway(response: Response, upstream: globalThis.Response, menu: RestaurantMenu, filter: MenuFilterResult, language: string, slug: RestaurantSlug, startedAt: number) {
  if (!upstream.body) throw new Error('INVALID_MODEL_RESPONSE')
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  response.setHeader('X-Accel-Buffering', 'no')
  response.flushHeaders?.()
  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let usage: GatewayResult['usage']
  let firstTokenMs: number | null = null
  let lineMode: 'unknown' | 'prose' | 'list' = 'unknown'
  let heldLine = ''
  let listItems = 0
  const allowedNames = new Set((filter.applied.length ? filter.dishes : menu.platos).map(dish => normalize(dish.nombre)))

  const visibleText = (content: string, final = false) => {
    let visible = ''
    const flushList = (newline: boolean) => {
      const item = heldLine.match(/^\s*(?:[-*•]|\d+[.)])\s+(?:\*\*)?(.+?)(?:\*\*)?\s+[—–-]\s+/)
      if (item && allowedNames.has(normalize(item[1].trim())) && listItems < 4) { visible += heldLine; listItems += 1 }
      if (newline && visible && !visible.endsWith('\n')) visible += '\n'
      heldLine = ''; lineMode = 'unknown'
    }
    for (const character of content) {
      if (character === '\n') {
        if (lineMode === 'list') flushList(true)
        else { visible += heldLine + '\n'; heldLine = ''; lineMode = 'unknown' }
        continue
      }
      if (lineMode === 'prose') { visible += character; continue }
      heldLine += character
      if (lineMode === 'list') continue
      const trimmed = heldLine.trimStart()
      if (!trimmed) continue
      if (/^[-*•]/.test(trimmed)) { lineMode = 'list'; continue }
      if (/^\d/.test(trimmed) && !/^\d+[^\d.)]/.test(trimmed)) {
        if (/^\d+[.)]/.test(trimmed)) lineMode = 'list'
        continue
      }
      lineMode = 'prose'; visible += heldLine; heldLine = ''
    }
    if (final) {
      if (lineMode === 'list') flushList(false)
      else visible += heldLine
      heldLine = ''; lineMode = 'unknown'
    }
    return visible
  }

  const emitEvent = (event: string) => {
    for (const line of event.split('\n')) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      let chunk: GatewayResult
      try { chunk = JSON.parse(data) as GatewayResult } catch { continue }
      const token = chunk.choices?.[0]?.delta?.content || ''
      const visible = visibleText(token)
      if (visible) {
        if (firstTokenMs === null) firstTokenMs = performance.now() - startedAt
        answer += visible
        response.write(`data: ${JSON.stringify({ choices: [{ delta: { content: visible } }] })}\n\n`)
      }
      if (chunk.usage) usage = chunk.usage
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n')
    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      emitEvent(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }
    if (done) break
  }
  if (buffer.trim()) emitEvent(buffer)
  const trailing = visibleText('', true)
  if (trailing) {
    if (firstTokenMs === null) firstTokenMs = performance.now() - startedAt
    answer += trailing
    response.write(`data: ${JSON.stringify({ choices: [{ delta: { content: trailing } }] })}\n\n`)
  }
  if (!answer.trim()) {
    const fallback = groundedFallback(menu, filter, language)
    for (const content of fallback.match(/[\s\S]{1,180}/g) || [fallback]) {
      answer += content
      response.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
    }
  }
  const withNotice = ensureAllergyNotice(answer, filter, language)
  if (withNotice.length > answer.length) {
    const content = withNotice.slice(answer.length)
    answer = withNotice
    response.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`)
  }
  const images = answerImages(menu, answer, slug)
  response.write(`data: ${JSON.stringify({ choices: [{ delta: {} }], platefy_images: images, usage, platefy_metrics: { provider_first_token_ms: firstTokenMs } })}\n\n`)
  response.end('data: [DONE]\n\n')
}

function clientIp(request: Request) { const value = request.headers['x-forwarded-for']; return (Array.isArray(value) ? value[0] : value?.split(',')[0])?.trim() || request.socket.remoteAddress || 'unknown' }
function withinLimit(request: Request) { const key = clientIp(request); const now = Date.now(); const current = windows.get(key); if (!current || now - current.started >= 60_000) { windows.set(key, { started: now, count: 1 }); return true } current.count += 1; return current.count <= 60 }
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
function ensureAllergyNotice(answer: string, filter: MenuFilterResult, language: string) {
  if (!filter.isSafetyQuestion || /(?:confirm|consulta|check)[\s\S]{0,100}(?:personal|equipo|restaurant|staff|team)/i.test(answer)) return answer
  return answer + (language === 'en' ? '\n\nPlease confirm ingredients, traces and cross-contamination with the restaurant team.' : language === 'ca' ? '\n\nConfirma els ingredients, les traces i la contaminació creuada amb l’equip del restaurant.' : '\n\nConfirma los ingredientes, las trazas y la contaminación cruzada con el equipo del restaurante.')
}

function groundedFallback(menu: RestaurantMenu, filter: MenuFilterResult, language: string) {
  const candidates = filter.dishes.filter(dish => dish.disponible).slice(0, 4)
  if (!candidates.length) return language === 'en' ? 'I could not find a menu item that matches all those requirements.' : language === 'ca' ? 'No he trobat cap plat de la carta que compleixi tots aquests requisits.' : 'No he encontrado ningún plato de la carta que cumpla todos esos requisitos.'
  const money = new Intl.NumberFormat(language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES', { style: 'currency', currency: menu.restaurante.moneda })
  const intro = language === 'en' ? 'These menu options match your request:' : language === 'ca' ? 'Aquestes opcions de la carta encaixen amb la consulta:' : 'Estas opciones de la carta encajan con tu consulta:'
  return [intro, ...candidates.map(dish => `- **${dish.nombre}** — ${money.format(dish.precio)} · ${dish.descripcion}`)].join('\n')
}

function upstreamError(status: number, detail = '') {
  if (status === 401 || status === 403) return { status: 503, message: 'The assistant connection requires attention.', reason: 'authentication' }
  if (status === 402 || /credit|quota|balance|budget/i.test(detail)) return { status: 429, message: 'The assistant has reached its available quota.', reason: 'quota_unavailable' }
  if (status === 429) return { status: 429, message: 'The assistant is receiving too many requests.', reason: 'rate_limited' }
  return { status: 503, message: 'The assistant is temporarily unavailable.', reason: 'provider' }
}

export default async function handler(request: Request, response: Response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0'); response.setHeader('X-Content-Type-Options', 'nosniff')
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); return response.status(405).json({ error: 'Method not allowed.' }) }
  if (!originAllowed(request)) return response.status(403).json({ error: 'Origin not allowed.' })
  if (!withinLimit(request)) return response.status(429).json({ error: 'Too many requests. Please wait a minute.', reason: 'rate_limited' })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const payload = sanitize(await readBody(request))
    const knowledge = sources(payload.restaurant)
    const question = payload.messages[payload.messages.length - 1].content
    const intent = classifyRestaurantIntent(knowledge.menu, question)
    if (intent === 'greeting' || intent === 'off-topic') {
      const answer = conversationalReply(knowledge.menu, payload.locale, intent)
      return streamAnswer(response, answer, intent === 'off-topic' ? answerImages(knowledge.menu, answer, payload.restaurant) : [])
    }
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
    const userQuestions = payload.messages.filter(message => message.role === 'user').map(message => message.content)
    const groupPlan = buildGroupBudgetPlan(knowledge.menu, userQuestions)
    if (groupPlan) {
      const answer = ensureAllergyNotice(formatGroupBudgetPlan(groupPlan, restaurantLocale(payload.locale)), groupPlan.filter, payload.locale)
      return streamAnswer(response, answer, answerImages(knowledge.menu, answer, payload.restaurant))
    }
    const gatewayKey = process.env.AI_GATEWAY_API_KEY
    if (!gatewayKey) return response.status(503).json({ error: 'The assistant connection is not configured.' })
    const grounded = getGroundedContext(knowledge, question, priorUserQuestions(payload.messages, payload.allergies))
    const controller = new AbortController(); timeout = setTimeout(() => controller.abort(), 25_000)
    request.once('close', () => { if (!request.complete) controller.abort() })
    const upstreamStarted = performance.now()
    const upstream = await fetch(GATEWAY_URL, {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${gatewayKey}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: grounded.system }, ...gatewayMessages(payload.messages)], temperature: 0.2, max_tokens: 700, stream: true, stream_options: { include_usage: true }, reasoning: { effort: 'none' }, providerOptions: { gateway: { models: FALLBACK_MODELS } } }),
    })
    if (!upstream.ok) {
      const detail = await upstream.text()
      if (upstream.status === 402 || upstream.status === 429) {
        const fallback = groundedFallback(knowledge.menu, grounded.filter, payload.locale)
        return streamAnswer(response, ensureAllergyNotice(fallback, grounded.filter, payload.locale), answerImages(knowledge.menu, fallback, payload.restaurant))
      }
      const error = upstreamError(upstream.status, detail)
      return response.status(error.status).json({ error: error.message, reason: error.reason })
    }
    return await streamGateway(response, upstream, knowledge.menu, grounded.filter, payload.locale, payload.restaurant, upstreamStarted)
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
