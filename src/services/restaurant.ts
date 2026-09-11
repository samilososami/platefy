export type RestaurantLocale = 'es' | 'en' | 'ca'
export type RestaurantSlug = 'ko' | 'vita' | 'pica-pica'
export type MenuCategory = 'entrante' | 'principal' | 'postre' | 'bebida'

export interface MenuDish {
  id: string
  nombre: string
  categoria: MenuCategory
  precio: number
  descripcion: string
  ingredientes: string[]
  alergenos: string[]
  dietas: string[]
  picante: number
  disponible: boolean
  seccion?: string
  imagen?: string | null
  imagen_alt?: string | null
  imagen_generada?: boolean
  alergenos_verificados?: boolean
}

export interface RestaurantMenu {
  schema_version: string
  actualizado: string
  restaurante: {
    nombre: string
    slug?: RestaurantSlug
    descripcion?: string
    titular?: string
    subtitulo?: string
    hero?: string
    ficticio: boolean
    tipo_cocina: string[]
    moneda: string
    horarios_cocina: { comidas: string; cenas: string }
    direccion: string | null
    telefono: string | null
    reservas_en_tiempo_real: boolean
    aviso_alergenos: string
  }
  categorias: MenuCategory[]
  alergenos_controlados: string[]
  platos: MenuDish[]
}

export interface RestaurantKnowledge { identity: string; menu: RestaurantMenu }
export interface MenuFilterResult { dishes: MenuDish[]; isSafetyQuestion: boolean; applied: string[] }

export interface DishImage { id: string; nombre: string; src: string; alt: string }

export interface GroupBudgetPlanLine { dish: MenuDish; quantity: number; subtotal: number }
export interface GroupBudgetPlan {
  partySize: number
  budget: number
  total: number
  perPerson: number
  remaining: number
  lines: GroupBudgetPlanLine[]
  filter: MenuFilterResult
}

const IDENTITY_URL = '/platefy.md'
const knowledgePromises = new Map<RestaurantSlug, Promise<RestaurantKnowledge>>()

export function isRestaurantSlug(value: unknown): value is RestaurantSlug {
  return value === 'ko' || value === 'vita' || value === 'pica-pica'
}

export function restaurantName(slug: RestaurantSlug): string {
  return { ko: 'Kō', vita: 'Vita', 'pica-pica': 'Pica Pica' }[slug]
}

export function restaurantAssetRoot(slug: RestaurantSlug): string {
  if (!isRestaurantSlug(slug)) throw new Error('INVALID_RESTAURANT')
  return slug === 'pica-pica' ? '/demos/pica-pica' : `/restaurantes/${slug}`
}

export function restaurantMenuPath(slug: RestaurantSlug): string {
  return `${restaurantAssetRoot(slug)}/menu.json`
}

export function getRestaurantSlug(
  pathname = typeof window === 'undefined' ? '/chatbot' : window.location.pathname,
  search = typeof window !== 'undefined' && pathname === window.location.pathname ? window.location.search : '',
): RestaurantSlug {
  const [route, inlineSearch] = pathname.split('?', 2)
  if (/^\/demo\/chat\/?$/.test(route)) {
    const selected = new URLSearchParams(inlineSearch ?? search).getAll('restaurant')
    return selected.length === 1 && isRestaurantSlug(selected[0]) ? selected[0] : 'ko'
  }
  const slug = route.match(/^\/restaurantes\/(ko|vita)(?:\/|$)/)?.[1]
  return isRestaurantSlug(slug) ? slug : 'ko'
}

/** Only same-restaurant image paths declared in the menu may be rendered in chat. */
export function safeDishImage(dish: Pick<MenuDish, 'id' | 'nombre' | 'imagen' | 'imagen_alt'>, slug: RestaurantSlug): DishImage | null {
  const src = dish.imagen
  if (typeof src !== 'string' || !/^\/[a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9_-]+)*\.(?:avif|webp|png|jpe?g)$/i.test(src)) return null
  if (!isRestaurantSlug(slug)) return null
  const roots = slug === 'pica-pica' ? ['/demos/pica-pica/'] : [`/restaurantes/${slug}/`, `/assets/restaurantes/${slug}/`]
  if (!roots.some(root => src.startsWith(root))) return null
  return { id: dish.id, nombre: dish.nombre, src, alt: dish.imagen_alt?.trim() || dish.nombre }
}

function isMenu(value: unknown): value is RestaurantMenu {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<RestaurantMenu>
  return typeof candidate.schema_version === 'string' && !!candidate.restaurante && Array.isArray(candidate.platos)
    && candidate.platos.length > 0 && candidate.platos.every(dish => typeof dish?.id === 'string'
      && typeof dish.nombre === 'string' && typeof dish.precio === 'number' && Array.isArray(dish.ingredientes)
      && Array.isArray(dish.alergenos) && Array.isArray(dish.dietas))
}

/** The identity and this restaurant's menu are the assistant's only knowledge files. */
export function loadRestaurantKnowledge(force = false, slug: RestaurantSlug = getRestaurantSlug()): Promise<RestaurantKnowledge> {
  if (!isRestaurantSlug(slug)) return Promise.reject(new Error('KNOWLEDGE_INVALID'))
  const existing = knowledgePromises.get(slug)
  if (existing && !force) return existing
  const pending = Promise.all([
    fetch(IDENTITY_URL, { credentials: 'same-origin', cache: 'no-cache' }),
    fetch(restaurantMenuPath(slug), { credentials: 'same-origin', cache: 'no-cache' }),
  ]).then(async ([identityResponse, menuResponse]) => {
    if (!identityResponse.ok || !menuResponse.ok) throw new Error('KNOWLEDGE_UNAVAILABLE')
    const [identity, menuValue] = await Promise.all([identityResponse.text(), menuResponse.json()])
    if (!identity.trim() || !isMenu(menuValue) || menuValue.restaurante.slug !== slug) throw new Error('KNOWLEDGE_INVALID')
    return { identity: identity.trim(), menu: menuValue }
  }).catch(error => { if (knowledgePromises.get(slug) === pending) knowledgePromises.delete(slug); throw error })
  knowledgePromises.set(slug, pending)
  return pending
}

export function restaurantLocale(locale: string): RestaurantLocale {
  const language = locale.toLowerCase().split('-')[0]
  return language === 'ca' || language === 'en' ? language : 'es'
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const allergenTerms: Record<string, string[]> = {
  gluten: ['gluten', 'celiac', 'trigo', 'wheat'],
  frutos_de_cascara: ['frutos secos', 'frutos de cascara', 'nueces', 'nuez', 'almendra', 'avellana', 'tree nuts', 'nuts', 'fruita seca'],
  cacahuetes: ['cacahuete', 'mani', 'peanut'],
  leche: ['leche', 'lactosa', 'lacteo', 'milk', 'lactose', 'llet'],
  huevo: ['huevo', 'egg', 'ou'], pescado: ['pescado', 'fish', 'peix'], crustaceos: ['marisco', 'crustaceo', 'gamba', 'langostino', 'shellfish'],
  moluscos: ['molusco', 'calamar', 'sepia', 'mollusc'], soja: ['soja', 'soy'], sesamo: ['sesamo', 'sesame'],
  mostaza: ['mostaza', 'mustard'], sulfitos: ['sulfito', 'sulphite'], apio: ['apio', 'celery'],
  altramuces: ['altramuz', 'altramuces', 'lupin', 'lupine'],
}

export const ALLERGEN_IDS = Object.keys(allergenTerms)

function mentionsAny(question: string, terms: string[]) { return terms.some(term => question.includes(term)) }
function allergenMention(text: string, term: string) {
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es|[oa]s?)?\\b`, 'i').test(text)
}

/** Match allergen names only inside exclusion clauses, not positive ingredient preferences. */
export function excludedAllergens(raw: string): string[] {
  const text = normalize(raw)
  const sections: string[] = []
  const starts = /\b(?:sin|without|sense|alerg(?:ia|ic[oa]?s?)|allerg(?:y|ic)|intoleran(?:cia|te|t)|no (?:puedo|debo|quiero) (?:comer|tomar|consumir)|avoid|evitar|evito|free of)\b/g
  for (const match of text.matchAll(starts)) {
    const before = text.slice(Math.max(0, match.index! - 20), match.index)
    if (/(?:no (?:tengo|soy)|not|no)\s*$/.test(before) && /alerg|allerg/.test(match[0])) continue
    const remainder = text.slice(match.index! + match[0].length)
    sections.push(remainder.split(/[.!?;]|\b(?:pero|but|con|with|amb|quiero|me apetece|muestrame|ensename)\b/)[0])
  }
  const found = Object.entries(allergenTerms).filter(([, terms]) => terms.some(term => sections.some(section => allergenMention(section, term)) || new RegExp(`\\b${term}[ -]?free\\b`).test(text))).map(([name]) => name)
  if (/celiac|celiaq/.test(text) && !found.includes('gluten')) found.push('gluten')
  if (/\bdairy[ -]?free\b/.test(text) && !found.includes('leche')) found.push('leche')
  if (/\bnut[ -]?free\b/.test(text) && !found.includes('frutos_de_cascara')) found.push('frutos_de_cascara')
  if (found.includes('frutos_de_cascara') && !found.includes('cacahuetes')) found.push('cacahuetes')
  return found
}
function compactDish(dish: MenuDish) {
  return { id: dish.id, nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio,
    descripcion: dish.descripcion, ingredientes: dish.ingredientes, alergenos: dish.alergenos,
    dietas: dish.dietas, picante: dish.picante, imagen_disponible: Boolean(dish.imagen) }
}
function leanDish(dish: MenuDish) {
  return { id: dish.id, nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio,
    alergenos: dish.alergenos, dietas: dish.dietas, imagen_disponible: Boolean(dish.imagen) }
}

/** Deterministic filtering runs before the LLM, especially for allergen and budget requests. */
export function filterMenu(menu: RestaurantMenu, rawQuestion: string, previousUserQuestions: string[] = [], explicitCategoryOnly = false): MenuFilterResult {
  const question = normalize(rawQuestion)
  const applied: string[] = []
  const priorExclusions = previousUserQuestions.flatMap(excludedAllergens)
  const exclusions = [...new Set([...priorExclusions, ...excludedAllergens(question)])]
  const safetyWords = priorExclusions.length > 0 || /alerg|allerg|intoler|celiac|celiaq|traza|trace|contaminacion|cross.?contamination|gluten.?free|nut.?free|dairy.?free|(?:sin|without|sense)\s/.test(question)
  if (exclusions.length) applied.push(`excluir_alergenos:${exclusions.join(',')}`)

  const vegan = /\bvegan[oa]?s?\b|\bvega\b/.test(question)
  const vegetarian = /\bvegetarian[oa]?s?\b|\bvegetaria\b/.test(question)
  const meat = /\b(con|tenga|quiero|apetece|lleve)\s+(algo\s+de\s+)?carne\b|\bcarnivor|\bwith meat\b|\bmeat dish\b|\bamb carn\b/.test(question)
  if (vegan) applied.push('dieta:vegano')
  else if (vegetarian) applied.push('dieta:vegetariano')
  if (meat) applied.push('dieta:carne')

  const budgetMatch = question.match(/(?:menos de|menys de|under|less than|hasta|maximo|maximum|max|presupuesto(?: de)?|budget(?: of)?|<)\s*(\d+(?:[.,]\d+)?)/)
  const budget = budgetMatch ? Number(budgetMatch[1].replace(',', '.')) : null
  if (budget !== null && Number.isFinite(budget)) applied.push(`precio_maximo:${budget}`)

  const categoryAliases: Record<MenuCategory, string[]> = { entrante: ['entrante', 'starter', 'appetizer'], principal: ['principal', 'main'], postre: ['postre', 'dessert'], bebida: ['bebida', 'drink'] }
  const mentionedCategory = (Object.keys(categoryAliases) as MenuCategory[]).find(value => mentionsAny(question, categoryAliases[value]))
  const category = explicitCategoryOnly && !/(?:solo|solamente|unicamente|exclusivamente|only|just|nomes)\b/.test(question) ? undefined : mentionedCategory
  if (category) applied.push(`categoria:${category}`)
  const sections = [...new Set(menu.platos.map(dish => dish.seccion).filter((value): value is string => Boolean(value)))]
  const section = sections.find(value => {
    const label = normalize(value)
    if (explicitCategoryOnly && !/(?:solo|solamente|unicamente|exclusivamente|only|just|nomes)\b/.test(question)) return false
    if (label === 'para compartir' && !/(?:seccion|apartado|section).{0,20}para compartir/.test(question)) return false
    return question.includes(label)
  })
  if (section) applied.push(`seccion:${section}`)

  const named = menu.platos.filter(dish => {
    const name = normalize(dish.nombre)
    return name.length > 4 && (question.includes(name) || name.split(/\s+/).filter(word => word.length > 5).some(word => question.includes(word)))
  })

  let dishes = menu.platos.filter(dish => dish.disponible)
  if (exclusions.length) dishes = dishes.filter(dish => !exclusions.some(allergen => dish.alergenos.includes(allergen)))
  if (vegan) dishes = dishes.filter(dish => dish.dietas.includes('vegano'))
  else if (vegetarian) dishes = dishes.filter(dish => dish.dietas.includes('vegetariano'))
  if (meat) dishes = dishes.filter(dish => dish.dietas.includes('carne'))
  if (budget !== null && Number.isFinite(budget)) {
    const strict = /^(?:menos de|menys de|under|less than|<)/.test(budgetMatch![0])
    dishes = dishes.filter(dish => strict ? dish.precio < budget : dish.precio <= budget)
  }
  if (category) dishes = dishes.filter(dish => dish.categoria === category)
  if (section) dishes = dishes.filter(dish => dish.seccion === section)

  if (!applied.length && named.length) dishes = named
  if (!applied.length && !named.length) {
    const meaningful = question.split(/[^a-z0-9]+/).filter(word => word.length >= 5)
    const relevant = dishes.filter(dish => {
      const searchable = normalize([dish.nombre, dish.descripcion, ...dish.ingredientes].join(' '))
      return meaningful.some(word => searchable.includes(word))
    })
    if (relevant.length) dishes = relevant
  }
  return { dishes, isSafetyQuestion: safetyWords, applied }
}

function latestNumber(messages: string[], patterns: RegExp[]): number | null {
  for (const message of [...messages].reverse()) {
    const text = normalize(message)
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return Number(match[1].replace(',', '.'))
    }
  }
  return null
}

function spreadByPrice(dishes: MenuDish[], count: number): MenuDish[] {
  const sorted = [...dishes].sort((a, b) => a.precio - b.precio || a.nombre.localeCompare(b.nombre))
  if (sorted.length <= count) return sorted
  if (count === 1) return [sorted[Math.floor(sorted.length / 2)]]
  return Array.from({ length: count }, (_, index) => sorted[Math.round(index * (sorted.length - 1) / (count - 1))])
}

/** Build an exact, menu-grounded group order close to a stated total budget. */
export function buildGroupBudgetPlan(menu: RestaurantMenu, userMessages: string[]): GroupBudgetPlan | null {
  const recent = userMessages.slice(-4)
  const context = normalize(recent.join('. '))
  if (!/(?:recom|suger|pedir|comer|cenar|cena|carta|menu|platos|tapas|pedido|elegir|escoger|pressupost|presupuesto|budget|suggest|order|meal|dinner|eat|menjar|triar|acerca|aproxim|llega|alcanza|close|near)/.test(context)) return null
  const partySize = latestNumber(recent, [
    /\b(?:somos|seremos|eramos|para|mesa (?:de|para)|grupo de|som|serem|per|for|party of)\s*(\d{1,2})\s*(?:personas?|persones?|comensales?|comensals?|people|diners?)?/,
    /\b(\d{1,2})\s*(?:personas?|persones?|comensales?|comensals?|people|diners?)\b/,
  ])
  const budget = latestNumber(recent, [
    /\b(?:presupuesto|pressupost|budget)(?:\s+(?:total|maximo|maximum))?\s*(?:de|d|of|es|a|:)??\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)?/,
    /\b(?:tenemos|teniamos|tenim|disponemos de|disposem de|contamos con|con|amb|spend)\s*(?:un\s+)?(?:presupuesto\s+de\s+)?(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)\b/,
    /\b(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)\b.{0,24}\b(?:presupuesto|pressupost|budget)\b/,
    /\b(?:acerca|aproxim|llega|alcanza|close|near)\w*\s*(?:a|to)?\s*(\d+(?:[.,]\d+)?)\b/,
  ])
  if (!partySize || !budget || partySize < 1 || partySize > 30 || budget < 5 || budget > 2000) return null

  const filter = filterMenu(menu, recent.join('. '), [], true)
  const available = (filter.applied.length ? filter.dishes : menu.platos).filter(dish => dish.disponible)
  if (!available.length) return { partySize, budget, total: 0, perPerson: 0, remaining: budget, lines: [], filter }

  const quotas: Record<MenuCategory, number> = { entrante: 2, principal: 3, postre: 1, bebida: 2 }
  const selected = (Object.keys(quotas) as MenuCategory[]).flatMap(category => spreadByPrice(available.filter(dish => dish.categoria === category), quotas[category]))
  const candidates = (selected.length >= Math.min(4, available.length) ? selected : spreadByPrice(available, 8)).slice(0, 8)
  const targetCents = Math.floor(budget * 97)
  const budgetCents = Math.round(budget * 100)
  const prices = candidates.map(dish => Math.round(dish.precio * 100))
  const maximums = candidates.map(() => partySize)
  const quantities = Array(candidates.length).fill(0) as number[]
  let cost = 0
  for (const index of candidates.map((_, index) => index).sort((a, b) => prices[a] - prices[b])) {
    if (cost + prices[index] <= budgetCents) { quantities[index] = 1; cost += prices[index] }
  }
  while (true) {
    const choices = candidates.map((_, index) => index).filter(index => quantities[index] < maximums[index] && cost + prices[index] <= budgetCents)
    if (!choices.length) break
    choices.sort((a, b) => quantities[a] - quantities[b] || Math.abs(targetCents - (cost + prices[a])) - Math.abs(targetCents - (cost + prices[b])) || prices[b] - prices[a])
    const next = choices[0]
    if (cost >= targetCents && Math.abs(targetCents - (cost + prices[next])) >= Math.abs(targetCents - cost)) break
    quantities[next] += 1; cost += prices[next]
  }
  const lines = quantities.flatMap((quantity, index) => quantity ? [{ dish: candidates[index], quantity, subtotal: Math.round(candidates[index].precio * quantity * 100) / 100 }] : [])
  const total = Math.round(cost) / 100
  return { partySize, budget, total, perPerson: Math.round(total / partySize * 100) / 100, remaining: Math.round((budget - total) * 100) / 100, lines, filter }
}

export function formatGroupBudgetPlan(plan: GroupBudgetPlan, language: RestaurantLocale): string {
  const locale = language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES'
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
  if (!plan.lines.length) return language === 'en' ? `I couldn't find a combination compatible with your requirements for ${plan.partySize} people.` : language === 'ca' ? `No he trobat una combinació compatible amb els requisits per a ${plan.partySize} persones.` : `No he encontrado una combinación compatible con los requisitos para ${plan.partySize} personas.`
  const intro = language === 'en'
    ? `For ${plan.partySize} people and a total budget of ${money.format(plan.budget)}, this menu-grounded proposal gets close without exceeding it:`
    : language === 'ca'
      ? `Per a ${plan.partySize} persones i un pressupost total de ${money.format(plan.budget)}, aquesta proposta s’hi acosta sense superar-lo:`
      : `Para ${plan.partySize} personas y un presupuesto total de ${money.format(plan.budget)}, esta propuesta se acerca sin superarlo:`
  const lines = plan.lines.map(({ dish, quantity, subtotal }) => `- **${dish.nombre}** — ${quantity} × ${money.format(dish.precio)} = ${money.format(subtotal)} · ${dish.descripcion}`)
  const total = language === 'en'
    ? `**Estimated total: ${money.format(plan.total)}** (${money.format(plan.perPerson)} per person). ${money.format(plan.remaining)} remains.`
    : language === 'ca'
      ? `**Total orientatiu: ${money.format(plan.total)}** (${money.format(plan.perPerson)} per persona). Queden ${money.format(plan.remaining)}.`
      : `**Total orientativo: ${money.format(plan.total)}** (${money.format(plan.perPerson)} por persona). Quedan ${money.format(plan.remaining)}.`
  const note = language === 'en' ? 'The menu does not specify portion sizes, so confirm the quantities with the restaurant team.' : language === 'ca' ? 'La carta no indica la mida de les racions; confirma les quantitats amb l’equip del restaurant.' : 'La carta no indica el tamaño de las raciones; confirma las cantidades con el equipo del restaurante.'
  return [intro, ...lines, total, note].join('\n\n')
}

export function getGroundedContext(knowledge: RestaurantKnowledge, question: string, previousUserQuestions: string[] = []): { system: string; filter: MenuFilterResult } {
  const filter = filterMenu(knowledge.menu, question, previousUserQuestions)
  const restaurant = knowledge.menu.restaurante
  const selection = filter.dishes.slice(0, filter.applied.length ? 14 : 34)
  const candidates = selection.length > 14 ? selection.map(leanDish) : selection.map(compactDish)
  const identity = restaurant.slug === 'pica-pica'
    ? `${knowledge.identity}\nLos nombres y precios de Pica Pica se transcriben de una carta fotografiada. Sus descripciones, ingredientes y alérgenos son propuestas de demostración sin verificar: explícalo si se consulta la composición y nunca presentes un plato como seguro para una alergia. Todos los platos pueden contener trazas de marisco.`
    : knowledge.identity
  const system = [identity, `Eres platefy, el asistente de ${restaurant.nombre}. Solo conoces la carta de este restaurante. Las conversaciones anteriores no son una fuente de datos. Nunca inventes platos, precios, ingredientes o imágenes. No escribas URLs ni imágenes Markdown: la aplicación añade las fotografías verificadas.`, 'DATOS_DEL_RESTAURANTE (fuente: menu.json):', JSON.stringify({
    nombre: restaurant.nombre, ficticio: restaurant.ficticio, cocina: restaurant.tipo_cocina,
    moneda: restaurant.moneda, horarios_cocina: restaurant.horarios_cocina,
    direccion: restaurant.direccion, telefono: restaurant.telefono,
    reservas_en_tiempo_real: restaurant.reservas_en_tiempo_real, aviso_alergenos: restaurant.aviso_alergenos,
  }), `FILTRO_DETERMINISTA: ${JSON.stringify({ aplicado: filter.applied, consulta_sensible: filter.isSafetyQuestion, coincidencias: filter.dishes.length })}`,
  'CANDIDATOS_VERIFICADOS (fuente: menu.json):', JSON.stringify(candidates),
  filter.applied.length ? 'La selección anterior ya aplica las restricciones detectadas. Recomienda únicamente esos candidatos; si está vacía, indica que no hay coincidencias.'
    : 'Responde solo con los datos anteriores. Si la pregunta no trata sobre la carta, usa únicamente DATOS_DEL_RESTAURANTE.',
  'Cuando recomiendes varios platos, elige como máximo cuatro. Escríbelos en una lista Markdown, una línea por plato, con este patrón: - **Nombre** — precio · motivo breve. Usa el nombre exacto de CANDIDATOS_VERIFICADOS. Si hay opciones con imagen_disponible=true, prioriza al menos una para que la interfaz pueda enseñarla. No vuelques la carta completa ni encadenes nombres en un párrafo.'].join('\n\n')
  return { system, filter }
}
