import { describe, expect, it } from 'vitest'
import koData from '../public/restaurantes/ko/menu.json'
import vitaData from '../public/restaurantes/vita/menu.json'
import picaData from '../public/demos/pica-pica/menu.json'
import { buildGroupBudgetPlan, formatGroupBudgetPlan, type MenuCategory, type RestaurantLocale, type RestaurantMenu } from '../src/services/restaurant'

const menus = { ko: koData, vita: vitaData, 'pica-pica': picaData } as unknown as Record<string, RestaurantMenu>
type Scenario = {
  name: string
  restaurant: keyof typeof menus
  messages: string[]
  party: number
  budget: number
  locale?: RestaurantLocale
  excluded?: string[]
  category?: MenuCategory
}

const scenarios: Scenario[] = [
  { name: 'es-5-180', restaurant: 'ko', messages: ['Somos 5 personas y tenemos un presupuesto de 180 euros, ¿qué nos recomiendas?'], party: 5, budget: 180 },
  { name: 'es-4-140', restaurant: 'ko', messages: ['Para 4 comensales y un presupuesto de 140 €, prepara una cena variada.'], party: 4, budget: 140 },
  { name: 'es-6-210', restaurant: 'ko', messages: ['Mesa para 6 personas, contamos con 210 EUR. Sugiere un pedido completo.'], party: 6, budget: 210 },
  { name: 'es-3-105', restaurant: 'ko', messages: ['Seremos 3 personas y disponemos de 105 euros para cenar. ¿Qué pedirías?'], party: 3, budget: 105 },
  { name: 'en-5-180', restaurant: 'ko', messages: ['We are a party of 5 with a total budget of 180 EUR. Suggest a balanced meal.'], party: 5, budget: 180, locale: 'en' },
  { name: 'ca-5-180', restaurant: 'ko', messages: ['Som 5 persones i tenim un pressupost de 180 euros. Què ens recomanes?'], party: 5, budget: 180, locale: 'ca' },
  { name: 'es-8-260', restaurant: 'ko', messages: ['Somos un grupo de 8 personas con un presupuesto total de 260 €. Elige platos variados.'], party: 8, budget: 260 },
  { name: 'es-2-80', restaurant: 'ko', messages: ['Para 2 personas, con 80 euros, recomiéndame una cena completa.'], party: 2, budget: 80 },
  { name: 'es-7-240', restaurant: 'ko', messages: ['Éramos 7 personas y teníamos un presupuesto de 240 euros. ¿Qué nos recomendarías?'], party: 7, budget: 240 },
  { name: 'es-5-160', restaurant: 'ko', messages: ['5 comensales. Presupuesto máximo: 160 euros. Haz una propuesta para compartir.'], party: 5, budget: 160 },
  { name: 'es-followup-180', restaurant: 'ko', messages: ['Somos 5 personas y tenemos un presupuesto de 180 euros. Recomiéndanos algo.', 'Eso no se acerca a 180, ajústalo de verdad.'], party: 5, budget: 180 },
  { name: 'es-followup-same-budget', restaurant: 'ko', messages: ['Para 4 personas, presupuesto de 150 euros. ¿Qué pedimos?', 'Sigue siendo muy poco; usa mejor el presupuesto.'], party: 4, budget: 150 },
  { name: 'en-followup', restaurant: 'ko', messages: ['Party of 6 people with a budget of 210 euros. Suggest dinner.', 'That is nowhere near 210. Recalculate the order.'], party: 6, budget: 210, locale: 'en' },
  { name: 'ca-followup', restaurant: 'ko', messages: ['Som 6 persones amb un pressupost de 200 euros. Recomana una selecció.', "Això no s'aproxima a 200; torna-ho a calcular."], party: 6, budget: 200, locale: 'ca' },
  { name: 'es-correction-new-budget', restaurant: 'ko', messages: ['Somos 5 personas y tenemos 140 euros para cenar.', 'Podemos subir el presupuesto a 190 euros. Reajusta el pedido.'], party: 5, budget: 190 },
  { name: 'vita-5-180', restaurant: 'vita', messages: ['Somos 5 personas, presupuesto de 180 €. Queremos una propuesta variada.'], party: 5, budget: 180 },
  { name: 'vita-4-135', restaurant: 'vita', messages: ['Para 4 comensales con 135 euros, ¿qué platos pedirías para compartir?'], party: 4, budget: 135 },
  { name: 'vita-vegan', restaurant: 'vita', messages: ['Somos 6 personas veganas y tenemos un presupuesto de 190 euros. Recomiéndanos una cena.'], party: 6, budget: 190 },
  { name: 'vita-gluten-free', restaurant: 'vita', messages: ['Para 5 personas con 170 euros, prepara un pedido sin gluten.'], party: 5, budget: 170, excluded: ['gluten'] },
  { name: 'vita-nut-free', restaurant: 'vita', messages: ['Somos 3 personas alérgicas a los frutos secos, presupuesto de 100 euros. ¿Qué podemos pedir?'], party: 3, budget: 100, excluded: ['frutos_de_cascara', 'cacahuetes'] },
  { name: 'vita-main-only', restaurant: 'vita', messages: ['Para 3 personas y un presupuesto de 85 euros, recomiéndame solo platos principales.'], party: 3, budget: 85, category: 'principal' },
  { name: 'vita-english', restaurant: 'vita', messages: ['For 7 people with a budget of 230 euros, suggest a varied vegetarian dinner.'], party: 7, budget: 230, locale: 'en' },
  { name: 'vita-catalan', restaurant: 'vita', messages: ['Per a 4 persones amb un pressupost de 130 euros, tria un sopar variat.'], party: 4, budget: 130, locale: 'ca' },
  { name: 'pica-5-180', restaurant: 'pica-pica', messages: ['Somos 5 personas y tenemos un presupuesto total de 180 euros. Recomienda tapas y platos.'], party: 5, budget: 180 },
  { name: 'pica-6-220', restaurant: 'pica-pica', messages: ['Mesa de 6 comensales, presupuesto de 220 €. Haz un pedido variado de mar y tierra.'], party: 6, budget: 220 },
  { name: 'pica-4-145', restaurant: 'pica-pica', messages: ['Para 4 personas con 145 euros, ¿qué pedirías para compartir?'], party: 4, budget: 145 },
  { name: 'pica-no-shellfish', restaurant: 'pica-pica', messages: ['Somos 5 personas, una es alérgica al marisco, y tenemos 175 euros. Recomienda una cena.'], party: 5, budget: 175, excluded: ['crustaceos'] },
  { name: 'pica-meat', restaurant: 'pica-pica', messages: ['Para 6 personas con un presupuesto de 200 euros queremos carne. Haz una propuesta.'], party: 6, budget: 200 },
  { name: 'pica-english', restaurant: 'pica-pica', messages: ['We are 4 people with a budget of 150 euros. Suggest a complete tapas meal.'], party: 4, budget: 150, locale: 'en' },
  { name: 'pica-followup', restaurant: 'pica-pica', messages: ['Somos 5 personas con presupuesto de 180 euros. Recomiéndanos una cena.', 'No llega ni de lejos a 180. Recalcula cantidades y total.'], party: 5, budget: 180 },
]

describe('30 medium and complex group-budget conversations', () => {
  it.each(scenarios)('$name', scenario => {
    const plan = buildGroupBudgetPlan(menus[scenario.restaurant], scenario.messages)
    expect(plan).not.toBeNull()
    expect(plan!.partySize).toBe(scenario.party)
    expect(plan!.budget).toBe(scenario.budget)
    expect(plan!.total).toBeLessThanOrEqual(scenario.budget)
    expect(plan!.total).toBeGreaterThanOrEqual(scenario.budget * 0.85)
    expect(plan!.lines.length).toBeGreaterThanOrEqual(3)
    expect(plan!.perPerson).toBeCloseTo(plan!.total / scenario.party, 1)
    for (const allergen of scenario.excluded ?? []) expect(plan!.lines.every(line => !line.dish.alergenos.includes(allergen))).toBe(true)
    if (scenario.category) expect(plan!.lines.every(line => line.dish.categoria === scenario.category)).toBe(true)
    const answer = formatGroupBudgetPlan(plan!, scenario.locale ?? 'es')
    expect(answer).toContain(String(scenario.party))
    expect(answer).toContain(plan!.lines[0].dish.nombre)
    expect(answer).toMatch(/Total orientativo|Total orientatiu|Estimated total/)
  })

  it.each(['Hola', 'Descríbeme la Segunda Guerra Mundial', '¿Qué tiempo hace mañana?'])(
    'does not revive a previous plan for a new turn: %s', current => {
      const plan = buildGroupBudgetPlan(menus.ko, [
        'Somos 5 personas y tenemos un presupuesto de 180 euros. Recomiéndanos una cena.',
        current,
      ])
      expect(plan).toBeNull()
    },
  )
})
