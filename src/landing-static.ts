import type { Locale } from './content';
import './landing.css';

type PageCopy = {
  title: string;
  description: string;
  imageAlt: string;
  text: Record<string, string>;
};

const copy: Record<Locale, PageCopy> = {
  es: {
    title: 'Platefy — IA que atiende tu restaurante',
    description: 'Platefy convierte la web de tu restaurante en una conversación que responde sobre la carta, recomienda platos y orienta a cada cliente.',
    imageAlt: 'Platefy y su esfera de cristal naranja sobre un fondo marfil',
    text: {
      'skip': 'Saltar al contenido', 'brand.home': 'Platefy, inicio', 'nav.label': 'Navegación principal', 'footer.navLabel': 'Navegación del pie de página', 'nav.product': 'Producto', 'nav.how': 'Cómo funciona', 'nav.faq': 'FAQ', 'nav.try': 'Conoce a Platefy', 'nav.openMenu': 'Abrir menú', 'nav.closeMenu': 'Cerrar menú', 'language': 'Idioma', 'orb.aria': 'Mascota esférica de Platefy',
      'hero.eyebrow': 'ASISTENTE PARA RESTAURANTES', 'hero.title': 'Tu restaurante, a una conversación de distancia.', 'hero.body': 'Responde, recomienda y orienta. Platefy atiende a cada cliente desde tu propia web.', 'hero.primary': 'Conoce a Platefy', 'hero.secondary': 'Ver cómo funciona', 'hero.note': 'Sin apps. En tu web. En su idioma.',
      'demo.label': 'PRESENTACIÓN', 'demo.status': 'Disponible ahora', 'demo.aria': 'Vista del asistente Platefy conversando sobre la carta de un restaurante', 'demo.hello': 'Hola. Soy Platefy.', 'demo.help': '¿En qué puedo ayudarte?', 'demo.question': '¿Qué me recomiendas sin lactosa?', 'demo.answer': 'Te recomiendo la ensalada de quinoa y aguacate: fresca, completa y sin lactosa.', 'demo.knows': 'CONOCE TU RESTAURANTE', 'demo.item1': 'Carta e ingredientes', 'demo.item2': 'Horarios y local', 'demo.item3': 'Preferencias y reservas',
      'intro.label': 'HOSPITALIDAD INTELIGENTE', 'intro.title': 'Cuida cada conversación. Desde la primera pregunta.', 'intro.body': 'Platefy reúne la carta, los horarios y la forma de atender de tu restaurante para dar respuestas útiles, naturales y coherentes con tu marca.', 'intro.link': 'Descubre cómo funciona',
      'cap.label': 'LO QUE PUEDE HACER', 'cap.title': 'Todo lo que tu equipo sabe. Disponible al instante.', 'cap.1.title': 'Menú inteligente', 'cap.1.body': 'Explica platos, ingredientes y preparaciones con contexto.', 'cap.2.title': 'Voz y chat', 'cap.2.body': 'Cada cliente elige la forma más cómoda de conversar.', 'cap.3.title': 'Recomendaciones', 'cap.3.body': 'Propone opciones que encajan con gustos y momento.', 'cap.4.title': 'Multidioma', 'cap.4.body': 'Mantiene la misma atención en varios idiomas.', 'cap.5.title': 'Presupuesto', 'cap.5.body': 'Ayuda a encontrar opciones según lo que quiere gastar.', 'cap.6.title': 'Alérgenos y dietas', 'cap.6.body': 'Aclara ingredientes para decidir con más confianza.',
      'how.label': 'TRES PASOS', 'how.title': 'Pregunta. Entiende. Recomienda.', 'how.1.title': 'Pregunta', 'how.1.body': 'El cliente pregunta desde tu web, con sus propias palabras.', 'how.2.title': 'Entiende', 'how.2.body': 'Platefy conecta la consulta con la carta y el contexto del local.', 'how.3.title': 'Responde', 'how.3.body': 'Entrega una respuesta clara y una recomendación que encaja.',
      'menu.label': 'TAMBIÉN PREPARAMOS TU CARTA', 'menu.title': '¿Necesitas una carta nueva?', 'menu.body': 'La diseñamos, ordenamos y dejamos lista para que Platefy la entienda desde el primer día. También podemos conectar la que ya tienes.',
      'faq.label': 'PREGUNTAS FRECUENTES', 'faq.title': 'Hablemos claro.', 'faq.1.q': '¿Tengo que cambiar mi web?', 'faq.1.a': 'No. Platefy se integra en tu web actual y mantiene la experiencia de tu marca.', 'faq.2.q': '¿Cómo aprende Platefy mi carta?', 'faq.2.a': 'Conectamos tu carta, horarios, ubicación y reglas del local. Tú decides qué sabe y cuándo se actualiza.', 'faq.3.q': '¿Funciona en varios idiomas?', 'faq.3.a': 'Sí. Puede atender en varios idiomas y conservar el contexto de la carta y del restaurante.',
      'closing.label': 'UNA MEJOR BIENVENIDA', 'closing.title': 'Cada gran experiencia empieza con una buena conversación.', 'closing.cta': 'Habla con Platefy', 'footer.note': 'IA para restaurantes, integrada en tu propia web.', 'footer.chat': 'Abrir chatbot', 'footer.rights': '© 2026 Platefy',
    },
  },
  en: {
    title: 'Platefy — AI service for your restaurant',
    description: 'Platefy turns your restaurant website into a conversation that answers menu questions, recommends dishes and guides every guest.',
    imageAlt: 'Platefy and its orange glass sphere on a warm ivory background',
    text: {
      'skip': 'Skip to content', 'brand.home': 'Platefy, home', 'nav.label': 'Main navigation', 'footer.navLabel': 'Footer navigation', 'nav.product': 'Product', 'nav.how': 'How it works', 'nav.faq': 'FAQ', 'nav.try': 'Meet Platefy', 'nav.openMenu': 'Open menu', 'nav.closeMenu': 'Close menu', 'language': 'Language', 'orb.aria': 'Platefy spherical mascot',
      'hero.eyebrow': 'AI ASSISTANT FOR RESTAURANTS', 'hero.title': 'Your restaurant, one conversation away.', 'hero.body': 'Answers, recommends and guides. Platefy helps every guest from your own website.', 'hero.primary': 'Meet Platefy', 'hero.secondary': 'See how it works', 'hero.note': 'No apps. On your website. In their language.',
      'demo.label': 'INTRODUCTION', 'demo.status': 'Available now', 'demo.aria': 'Preview of the Platefy assistant discussing a restaurant menu', 'demo.hello': 'Hello. I’m Platefy.', 'demo.help': 'How can I help?', 'demo.question': 'What would you suggest without dairy?', 'demo.answer': 'Try the quinoa and avocado salad: fresh, complete and dairy-free.', 'demo.knows': 'KNOWS YOUR RESTAURANT', 'demo.item1': 'Menu and ingredients', 'demo.item2': 'Hours and venue', 'demo.item3': 'Preferences and bookings',
      'intro.label': 'INTELLIGENT HOSPITALITY', 'intro.title': 'Care for every conversation. From the first question.', 'intro.body': 'Platefy brings together your menu, opening hours and service style to give useful, natural answers that feel consistent with your brand.', 'intro.link': 'Discover how it works',
      'cap.label': 'WHAT IT CAN DO', 'cap.title': 'Everything your team knows. Available instantly.', 'cap.1.title': 'Smart menu', 'cap.1.body': 'Explains dishes, ingredients and preparation with context.', 'cap.2.title': 'Voice and chat', 'cap.2.body': 'Every guest chooses the most comfortable way to talk.', 'cap.3.title': 'Recommendations', 'cap.3.body': 'Suggests options that fit each taste and moment.', 'cap.4.title': 'Multilingual', 'cap.4.body': 'Keeps the same standard of service across languages.', 'cap.5.title': 'Budget', 'cap.5.body': 'Helps guests find options within what they want to spend.', 'cap.6.title': 'Allergens and diets', 'cap.6.body': 'Clarifies ingredients so guests can choose with confidence.',
      'how.label': 'THREE STEPS', 'how.title': 'Ask. Understand. Recommend.', 'how.1.title': 'Ask', 'how.1.body': 'A guest asks on your website, using their own words.', 'how.2.title': 'Understand', 'how.2.body': 'Platefy connects the question to the menu and venue context.', 'how.3.title': 'Answer', 'how.3.body': 'It gives a clear answer and a recommendation that fits.',
      'menu.label': 'WE CAN ALSO PREPARE YOUR MENU', 'menu.title': 'Need a new menu?', 'menu.body': 'We design it, organise it and make it ready for Platefy from day one. We can also connect the menu you already have.',
      'faq.label': 'FREQUENT QUESTIONS', 'faq.title': 'Let’s be clear.', 'faq.1.q': 'Do I need to change my website?', 'faq.1.a': 'No. Platefy integrates with your current website and keeps your brand experience intact.', 'faq.2.q': 'How does Platefy learn my menu?', 'faq.2.a': 'We connect your menu, hours, location and venue rules. You decide what it knows and when it is updated.', 'faq.3.q': 'Does it work in multiple languages?', 'faq.3.a': 'Yes. It can serve guests in multiple languages while keeping the menu and restaurant context.',
      'closing.label': 'A BETTER WELCOME', 'closing.title': 'Every great experience begins with a good conversation.', 'closing.cta': 'Talk to Platefy', 'footer.note': 'AI for restaurants, embedded in your own website.', 'footer.chat': 'Open chatbot', 'footer.rights': '© 2026 Platefy',
    },
  },
  ca: {
    title: 'Platefy — IA que atén el teu restaurant',
    description: 'Platefy converteix el web del teu restaurant en una conversa que respon sobre la carta, recomana plats i orienta cada client.',
    imageAlt: 'Platefy i la seva esfera de vidre taronja sobre un fons marfil',
    text: {
      'skip': 'Ves al contingut', 'brand.home': 'Platefy, inici', 'nav.label': 'Navegació principal', 'footer.navLabel': 'Navegació del peu de pàgina', 'nav.product': 'Producte', 'nav.how': 'Com funciona', 'nav.faq': 'FAQ', 'nav.try': 'Coneix Platefy', 'nav.openMenu': 'Obrir menú', 'nav.closeMenu': 'Tancar menú', 'language': 'Idioma', 'orb.aria': 'Mascota esfèrica de Platefy',
      'hero.eyebrow': 'ASSISTENT PER A RESTAURANTS', 'hero.title': 'El teu restaurant, a una conversa de distància.', 'hero.body': 'Respon, recomana i orienta. Platefy atén cada client des del teu propi web.', 'hero.primary': 'Coneix Platefy', 'hero.secondary': 'Descobreix com funciona', 'hero.note': 'Sense apps. Al teu web. En el seu idioma.',
      'demo.label': 'PRESENTACIÓ', 'demo.status': 'Disponible ara', 'demo.aria': 'Vista de l’assistent Platefy conversant sobre la carta d’un restaurant', 'demo.hello': 'Hola. Soc Platefy.', 'demo.help': 'Com et puc ajudar?', 'demo.question': 'Què em recomanes sense lactosa?', 'demo.answer': 'Et recomano l’amanida de quinoa i alvocat: fresca, completa i sense lactosa.', 'demo.knows': 'CONEIX EL TEU RESTAURANT', 'demo.item1': 'Carta i ingredients', 'demo.item2': 'Horaris i local', 'demo.item3': 'Preferències i reserves',
      'intro.label': 'HOSPITALITAT INTEL·LIGENT', 'intro.title': 'Cuida cada conversa. Des de la primera pregunta.', 'intro.body': 'Platefy reuneix la carta, els horaris i la manera d’atendre del teu restaurant per donar respostes útils, naturals i coherents amb la teva marca.', 'intro.link': 'Descobreix com funciona',
      'cap.label': 'EL QUE POT FER', 'cap.title': 'Tot el que sap el teu equip. Disponible a l’instant.', 'cap.1.title': 'Menú intel·ligent', 'cap.1.body': 'Explica plats, ingredients i preparacions amb context.', 'cap.2.title': 'Veu i xat', 'cap.2.body': 'Cada client tria la manera més còmoda de conversar.', 'cap.3.title': 'Recomanacions', 'cap.3.body': 'Proposa opcions que encaixen amb gustos i moment.', 'cap.4.title': 'Multidioma', 'cap.4.body': 'Manté la mateixa atenció en diversos idiomes.', 'cap.5.title': 'Pressupost', 'cap.5.body': 'Ajuda a trobar opcions segons el que vol gastar.', 'cap.6.title': 'Al·lèrgens i dietes', 'cap.6.body': 'Aclareix ingredients per decidir amb més confiança.',
      'how.label': 'TRES PASSOS', 'how.title': 'Pregunta. Entén. Recomana.', 'how.1.title': 'Pregunta', 'how.1.body': 'El client pregunta des del teu web, amb les seves paraules.', 'how.2.title': 'Entén', 'how.2.body': 'Platefy connecta la consulta amb la carta i el context del local.', 'how.3.title': 'Respon', 'how.3.body': 'Dona una resposta clara i una recomanació que encaixa.',
      'menu.label': 'TAMBÉ PREPAREM LA TEVA CARTA', 'menu.title': 'Necessites una carta nova?', 'menu.body': 'La dissenyem, ordenem i deixem preparada perquè Platefy l’entengui des del primer dia. També podem connectar la que ja tens.',
      'faq.label': 'PREGUNTES FREQÜENTS', 'faq.title': 'Parlem clar.', 'faq.1.q': 'He de canviar el meu web?', 'faq.1.a': 'No. Platefy s’integra al teu web actual i manté l’experiència de la teva marca.', 'faq.2.q': 'Com aprèn Platefy la meva carta?', 'faq.2.a': 'Connectem la carta, els horaris, la ubicació i les regles del local. Tu decideixes què sap i quan s’actualitza.', 'faq.3.q': 'Funciona en diversos idiomes?', 'faq.3.a': 'Sí. Pot atendre en diversos idiomes i conservar el context de la carta i del restaurant.',
      'closing.label': 'UNA MILLOR BENVINGUDA', 'closing.title': 'Cada gran experiència comença amb una bona conversa.', 'closing.cta': 'Parla amb Platefy', 'footer.note': 'IA per a restaurants, integrada al teu propi web.', 'footer.chat': 'Obrir chatbot', 'footer.rights': '© 2026 Platefy',
    },
  },
};

const languageSelect = document.querySelector<HTMLSelectElement>('#language-select');
const menuButton = document.querySelector<HTMLButtonElement>('#menu-button');
const navigation = document.querySelector<HTMLElement>('#site-navigation');
const routeLocale: Locale = location.pathname.startsWith('/en/') ? 'en' : location.pathname.startsWith('/ca/') ? 'ca' : 'es';
let locale: Locale = routeLocale;

function closeMenu() {
  navigation?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', copy[locale].text['nav.openMenu']);
}

function applyLocale(nextLocale: Locale) {
  locale = nextLocale;
  const page = copy[locale];
  document.documentElement.lang = locale;
  document.title = page.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', page.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', page.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', page.description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', page.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', page.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:image:alt"]')?.setAttribute('content', page.imageAlt);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:image:alt"]')?.setAttribute('content', page.imageAlt);
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (key && page.text[key]) node.textContent = page.text[key];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(node => {
    const key = node.dataset.i18nAria;
    if (key && page.text[key]) node.setAttribute('aria-label', page.text[key]);
  });
  languageSelect?.setAttribute('aria-label', page.text.language);
  closeMenu();
  try { localStorage.setItem('platefy-language', locale); } catch { /* Storage can be unavailable in private mode. */ }
}

try {
  const stored = localStorage.getItem('platefy-language');
  if (routeLocale === 'es' && (stored === 'en' || stored === 'ca')) {
    location.replace(`/${stored}/${location.hash}`);
  }
} catch { /* Keep the route language when storage is unavailable. */ }

if (languageSelect) {
  languageSelect.value = locale;
  languageSelect.addEventListener('change', () => {
    const nextLocale = languageSelect.value as Locale;
    try { localStorage.setItem('platefy-language', nextLocale); } catch { /* Navigation still works. */ }
    location.assign(`${nextLocale === 'es' ? '/' : `/${nextLocale}/`}${location.hash}`);
  });
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation?.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', copy[locale].text[open ? 'nav.closeMenu' : 'nav.openMenu']);
  if (open) navigation?.querySelector<HTMLAnchorElement>('a')?.focus();
});

navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation?.classList.contains('is-open')) {
    closeMenu();
    menuButton?.focus();
  }
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealNodes = document.querySelectorAll<HTMLElement>('.reveal');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.08 });
  revealNodes.forEach(node => { node.classList.add('will-reveal'); observer.observe(node); });
}

applyLocale(locale);
