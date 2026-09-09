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
export function filterMenu(menu: RestaurantMenu, rawQuestion: string, previousUserQuestions: string[] = []): MenuFilterResult {
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
  const category = (Object.keys(categoryAliases) as MenuCategory[]).find(value => mentionsAny(question, categoryAliases[value]))
  if (category) applied.push(`categoria:${category}`)
  const sections = [...new Set(menu.platos.map(dish => dish.seccion).filter((value): value is string => Boolean(value)))]
  const section = sections.find(value => question.includes(normalize(value)))
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
