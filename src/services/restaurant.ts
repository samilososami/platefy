export type RestaurantLocale = 'es' | 'en' | 'ca'
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
}

export interface RestaurantMenu {
  schema_version: string
  actualizado: string
  restaurante: {
    nombre: string
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

const MENU_URL = '/menu/MENU.json'
const IDENTITY_URL = '/menu/PL8.md'
let knowledgePromise: Promise<RestaurantKnowledge> | null = null

function isMenu(value: unknown): value is RestaurantMenu {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<RestaurantMenu>
  return typeof candidate.schema_version === 'string' && !!candidate.restaurante && Array.isArray(candidate.platos)
    && candidate.platos.length > 0 && candidate.platos.every(dish => typeof dish?.id === 'string'
      && typeof dish.nombre === 'string' && typeof dish.precio === 'number' && Array.isArray(dish.ingredientes)
      && Array.isArray(dish.alergenos) && Array.isArray(dish.dietas))
}

/** Loads the only two knowledge sources used by PL8. The browser HTTP cache may reuse them. */
export function loadRestaurantKnowledge(force = false): Promise<RestaurantKnowledge> {
  if (knowledgePromise && !force) return knowledgePromise
  knowledgePromise = Promise.all([
    fetch(IDENTITY_URL, { credentials: 'same-origin', cache: 'default' }),
    fetch(MENU_URL, { credentials: 'same-origin', cache: 'default' }),
  ]).then(async ([identityResponse, menuResponse]) => {
    if (!identityResponse.ok || !menuResponse.ok) throw new Error('KNOWLEDGE_UNAVAILABLE')
    const [identity, menuValue] = await Promise.all([identityResponse.text(), menuResponse.json()])
    if (!identity.trim() || !isMenu(menuValue)) throw new Error('KNOWLEDGE_INVALID')
    return { identity: identity.trim(), menu: menuValue }
  }).catch(error => { knowledgePromise = null; throw error })
  return knowledgePromise
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
}

function mentionsAny(question: string, terms: string[]) { return terms.some(term => question.includes(term)) }
function compactDish(dish: MenuDish) {
  return { id: dish.id, nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio,
    descripcion: dish.descripcion, ingredientes: dish.ingredientes, alergenos: dish.alergenos,
    dietas: dish.dietas, picante: dish.picante }
}
function leanDish(dish: MenuDish) {
  return { id: dish.id, nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio,
    alergenos: dish.alergenos, dietas: dish.dietas }
}

/** Deterministic filtering runs before the LLM, especially for allergen and budget requests. */
export function filterMenu(menu: RestaurantMenu, rawQuestion: string): MenuFilterResult {
  const question = normalize(rawQuestion)
  const applied: string[] = []
  const safetyWords = /alerg|intoler|celiac|celiaq|traza|trace|contaminacion|cross.?contamination|gluten.?free|nut.?free|dairy.?free|(?:sin|without|sense)\s/.test(question)
  const excludedAllergens = Object.entries(allergenTerms)
    .filter(([, terms]) => mentionsAny(question, terms) && safetyWords).map(([allergen]) => allergen)
  if (excludedAllergens.includes('frutos_de_cascara') && !excludedAllergens.includes('cacahuetes')) excludedAllergens.push('cacahuetes')
  if (excludedAllergens.length) applied.push(`excluir_alergenos:${excludedAllergens.join(',')}`)

  const vegan = /\bvegan[oa]?s?\b|\bvega\b/.test(question)
  const vegetarian = /\bvegetarian[oa]?s?\b|\bvegetaria\b/.test(question)
  const meat = /\b(con|tenga|quiero|apetece|lleve)\s+(algo\s+de\s+)?carne\b|\bcarnivor|\bwith meat\b|\bmeat dish\b|\bamb carn\b/.test(question)
  if (vegan) applied.push('dieta:vegano')
  else if (vegetarian) applied.push('dieta:vegetariano')
  if (meat) applied.push('dieta:carne')

  const budgetMatch = question.match(/(?:menos de|menys de|under|less than|hasta|maximo|maximum|max|presupuesto(?: de)?|budget(?: of)?|<)\s*(\d+(?:[.,]\d+)?)/)
  const budget = budgetMatch ? Number(budgetMatch[1].replace(',', '.')) : null
  if (budget !== null && Number.isFinite(budget)) applied.push(`precio_maximo:${budget}`)

  const categoryAliases: Record<MenuCategory, string[]> = { entrante: ['entrante', 'starter', 'appetizer'], principal: ['principal', 'plato', 'main'], postre: ['postre', 'dessert'], bebida: ['bebida', 'drink'] }
  const category = (Object.keys(categoryAliases) as MenuCategory[]).find(value => mentionsAny(question, categoryAliases[value]))
  if (category) applied.push(`categoria:${category}`)

  const named = menu.platos.filter(dish => {
    const name = normalize(dish.nombre)
    return name.length > 4 && (question.includes(name) || name.split(/\s+/).filter(word => word.length > 5).some(word => question.includes(word)))
  })

  let dishes = menu.platos.filter(dish => dish.disponible)
  if (excludedAllergens.length) dishes = dishes.filter(dish => !excludedAllergens.some(allergen => dish.alergenos.includes(allergen)))
  if (vegan) dishes = dishes.filter(dish => dish.dietas.includes('vegano'))
  else if (vegetarian) dishes = dishes.filter(dish => dish.dietas.includes('vegetariano'))
  if (meat) dishes = dishes.filter(dish => dish.dietas.includes('carne'))
  if (budget !== null && Number.isFinite(budget)) dishes = dishes.filter(dish => dish.precio < budget)
  if (category) dishes = dishes.filter(dish => dish.categoria === category)

  if (!applied.length && named.length) dishes = named
  if (!applied.length && !named.length) {
    const meaningful = question.split(/[^a-z0-9]+/).filter(word => word.length >= 5)
    const relevant = dishes.filter(dish => {
      const searchable = normalize([dish.nombre, dish.descripcion, ...dish.ingredientes].join(' '))
      return meaningful.some(word => searchable.includes(word))
    })
    if (relevant.length) dishes = relevant
  }
  return { dishes: dishes.slice(0, applied.length ? 14 : 34), isSafetyQuestion: safetyWords, applied }
}

export function getGroundedContext(knowledge: RestaurantKnowledge, question: string): { system: string; filter: MenuFilterResult } {
  const filter = filterMenu(knowledge.menu, question)
  const restaurant = knowledge.menu.restaurante
  const candidates = filter.dishes.length > 14 ? filter.dishes.map(leanDish) : filter.dishes.map(compactDish)
  const system = [knowledge.identity, 'DATOS_DEL_RESTAURANTE (fuente: MENU.json):', JSON.stringify({
    nombre: restaurant.nombre, ficticio: restaurant.ficticio, cocina: restaurant.tipo_cocina,
    moneda: restaurant.moneda, horarios_cocina: restaurant.horarios_cocina,
    direccion: restaurant.direccion, telefono: restaurant.telefono,
    reservas_en_tiempo_real: restaurant.reservas_en_tiempo_real, aviso_alergenos: restaurant.aviso_alergenos,
  }), `FILTRO_DETERMINISTA: ${JSON.stringify({ aplicado: filter.applied, consulta_sensible: filter.isSafetyQuestion, coincidencias: filter.dishes.length })}`,
  'CANDIDATOS_VERIFICADOS (fuente: MENU.json):', JSON.stringify(candidates),
  filter.applied.length ? 'La selección anterior ya aplica las restricciones detectadas. Recomienda únicamente esos candidatos; si está vacía, indica que no hay coincidencias.'
    : 'Responde solo con los datos anteriores. Si la pregunta no trata sobre la carta, usa únicamente DATOS_DEL_RESTAURANTE.'].join('\n\n')
  return { system, filter }
}
