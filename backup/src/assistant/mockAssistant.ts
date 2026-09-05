import type { Locale } from "../content";

const answers: Record<Locale, Record<"vegetarian" | "gluten" | "budget" | "hours" | "default", string>> = {
  es: {
    vegetarian: "Te recomiendo el tartar de tomate con aguacate. Es fresco, vegetal y perfecto para empezar.",
    gluten: "Sí. El tartar de tomate y el arroz cremoso de setas pueden prepararse sin gluten. Avísanos de cualquier alergia para confirmarlo con cocina.",
    budget: "Por menos de 15 €, la mejor combinación es nuestra crema de temporada y el tartar de tomate. Ligera, completa y con mucho sabor.",
    hours: "Hoy la cocina sirve comidas de 13:00 a 16:00 y cenas de 20:00 a 23:30.",
    default: "Puedo ayudarte con platos, ingredientes, alérgenos, precios y horarios. Cuéntame qué te apetece y te recomiendo algo a tu medida.",
  },
  en: {
    vegetarian: "I recommend the tomato and avocado tartare. It’s fresh, plant-based and a lovely way to start.",
    gluten: "Yes. The tomato tartare and creamy mushroom rice can be prepared gluten-free. Please mention any allergy so the kitchen can confirm it.",
    budget: "Under €15, the best pairing is our seasonal soup with the tomato tartare: light, complete and full of flavour.",
    hours: "Today the kitchen serves lunch from 1 pm to 4 pm and dinner from 8 pm to 11:30 pm.",
    default: "I can help with dishes, ingredients, allergens, prices and opening hours. Tell me what you feel like and I’ll find a good match.",
  },
  ca: {
    vegetarian: "Et recomano el tàrtar de tomàquet amb alvocat. És fresc, vegetal i perfecte per començar.",
    gluten: "Sí. El tàrtar de tomàquet i l’arròs cremós de bolets es poden preparar sense gluten. Avisa’ns de qualsevol al·lèrgia perquè cuina ho confirmi.",
    budget: "Per menys de 15 €, la millor combinació és la crema de temporada amb el tàrtar de tomàquet: lleugera, completa i plena de sabor.",
    hours: "Avui la cuina serveix dinars de 13:00 a 16:00 i sopars de 20:00 a 23:30.",
    default: "Puc ajudar-te amb plats, ingredients, al·lèrgens, preus i horaris. Digues-me què et ve de gust i trobaré una bona opció.",
  },
};

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

export function createMockAnswer(question: string, locale: Locale): string {
  const normalized = question.toLocaleLowerCase(locale);
  const localeAnswers = answers[locale];

  if (includesAny(normalized, ["veget", "vegà", "vegan", "liger", "light", "lleuger"])) {
    return localeAnswers.vegetarian;
  }

  if (includesAny(normalized, ["gluten", "celiac", "celíac", "alerg", "al·lèrg"])) {
    return localeAnswers.gluten;
  }

  if (includesAny(normalized, ["15", "precio", "preu", "price", "barat", "cheap", "presupuesto"])) {
    return localeAnswers.budget;
  }

  if (includesAny(normalized, ["hora", "open", "close", "obert", "tanca", "cocina", "cuina"])) {
    return localeAnswers.hours;
  }

  return localeAnswers.default;
}
