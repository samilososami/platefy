export type Locale = "es" | "en" | "ca";

export type FaqItem = {
  question: string;
  answer: string;
};

export type SiteCopy = {
  localeName: string;
  nav: {
    product: string;
    how: string;
    benefits: string;
    faq: string;
    demo: string;
    openMenu: string;
    closeMenu: string;
    chooseLanguage: string;
  };
  hero: {
    title: string[];
    body: string;
    demo: string;
    talk: string;
    trust: string;
    stageLabel: string;
    instant: string;
    instantQuestion: string;
    instantAnswer: string;
    language: string;
    languageQuestion: string;
    languageAnswer: string;
    scroll: string;
  };
  conversation: {
    title: string;
    body: string;
    steps: string[];
    client: string;
    question: string;
    answer: string;
    recommendation: string;
    dish: string;
    tags: string[];
  };
  capabilities: {
    title: string;
    items: string[];
    benefit: string;
  };
  menuBuilder: {
    title: string;
    body: string;
    label: string;
    placeholder: string;
    submit: string;
    submitted: string;
    note: string;
    before: string;
    after: string;
    paperTitle: string;
    assistantTitle: string;
    previewQuestion: string;
    previewAnswer: string;
  };
  faq: {
    title: string;
    items: FaqItem[];
  };
  cta: {
    titleStart: string;
    titleAccent: string;
    demo: string;
    talk: string;
  };
  footer: {
    product: string;
    contact: string;
    note: string;
  };
  demo: {
    label: string;
    title: string;
    intro: string;
    close: string;
    input: string;
    send: string;
    suggestions: string[];
    answer: string;
    typing: string;
  };
};

export const localeOrder: Locale[] = ["es", "en", "ca"];

export const content: Record<Locale, SiteCopy> = {
  es: {
    localeName: "Español",
    nav: {
      product: "Producto",
      how: "Cómo funciona",
      benefits: "Beneficios",
      faq: "FAQ",
      demo: "Ver una demo",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      chooseLanguage: "Elegir idioma",
    },
    hero: {
      title: ["Tu carta,", "ahora sabe", "conversar."],
      body: "Platefy convierte la web de tu restaurante en una experiencia que responde, recomienda y acompaña a cada cliente, en su idioma.",
      demo: "Ver una demo",
      talk: "Hablar con nosotros",
      trust: "Sin apps. Sin fricción. En tu propia web.",
      stageLabel: "Demo interactiva del asistente Platefy",
      instant: "Responde al instante",
      instantQuestion: "¿Tienen opciones sin lactosa?",
      instantAnswer: "Sí, y puedo recomendarte tres.",
      language: "En su idioma",
      languageQuestion: "Do you have vegan options?",
      languageAnswer: "Yes. Here are three dishes.",
      scroll: "Descubrir Platefy",
    },
    conversation: {
      title: "Una conversación que conoce tu restaurante.",
      body: "Carta, ingredientes, horarios, ubicación y estilo de cocina. Platefy responde con contexto real para que cada cliente decida mejor.",
      steps: ["Pregunta", "Entiende", "Recomienda"],
      client: "Cliente",
      question: "¿Tienen opciones vegetarianas sin lactosa?",
      answer: "Sí. Cruzo la carta con tus preferencias y alérgenos.",
      recommendation: "Te recomiendo esta opción:",
      dish: "Ensalada de quinoa y aguacate",
      tags: ["Vegano", "Sin lactosa", "Fresco"],
    },
    capabilities: {
      title: "Todo lo que tu equipo sabe. Disponible al instante.",
      items: [
        "Menú inteligente",
        "Voz y chat",
        "Recomendaciones",
        "Multidioma",
        "Presupuesto",
        "Alérgenos y dietas",
      ],
      benefit: "Menos dudas. Más confianza. Mejores decisiones.",
    },
    menuBuilder: {
      title: "¿Necesitas una carta nueva?",
      body: "La diseñamos, ordenamos y dejamos lista para que Platefy la entienda desde el primer día.",
      label: "Cuéntanos qué necesita tu restaurante",
      placeholder: "Ej. una carta clara, con alérgenos, precios y recomendaciones bien organizadas.",
      submit: "Preparar mi carta",
      submitted: "Carta preparada",
      note: "También podemos conectar la carta que ya tienes.",
      before: "Antes",
      after: "Después",
      paperTitle: "Nuestra carta",
      assistantTitle: "¿En qué podemos ayudarte?",
      previewQuestion: "¿Qué opciones vegetarianas tienen?",
      previewAnswer: "Tengo tres opciones que encajan contigo.",
    },
    faq: {
      title: "Preguntas que suelen aparecer antes de empezar.",
      items: [
        {
          question: "¿Tengo que cambiar mi web?",
          answer: "No. Platefy se integra en tu web actual y mantiene la experiencia de tu marca.",
        },
        {
          question: "¿Cómo aprende Platefy mi carta?",
          answer: "Conectamos tu carta, horarios, ubicación y reglas del local. Tú decides qué sabe y cuándo se actualiza.",
        },
        {
          question: "¿Funciona en varios idiomas?",
          answer: "Sí. Puede atender en varios idiomas y conservar el contexto de la carta y del restaurante.",
        },
      ],
    },
    cta: {
      titleStart: "Haz que cada visita empiece con",
      titleAccent: "una buena respuesta.",
      demo: "Ver una demo",
      talk: "Hablar con nosotros",
    },
    footer: {
      product: "Producto",
      contact: "Contacto",
      note: "IA para restaurantes, integrada en tu propia web.",
    },
    demo: {
      label: "Demo de Platefy",
      title: "Pregunta como si ya estuvieras en la mesa.",
      intro: "Esta demo es una simulación local de cómo Platefy entiende la carta y recomienda con contexto.",
      close: "Cerrar demo",
      input: "Escribe una pregunta sobre la carta…",
      send: "Enviar pregunta",
      suggestions: ["¿Qué puedo comer sin gluten?", "Recomiéndame algo ligero", "¿Tenéis opciones por menos de 15 €?"],
      answer: "Claro. Te recomiendo la ensalada de quinoa y aguacate: es fresca, sin gluten y puedo adaptarla a tus preferencias.",
      typing: "Platefy está pensando…",
    },
  },
  en: {
    localeName: "English",
    nav: {
      product: "Product",
      how: "How it works",
      benefits: "Benefits",
      faq: "FAQ",
      demo: "See a demo",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      chooseLanguage: "Choose language",
    },
    hero: {
      title: ["Your menu,", "now ready to", "talk."],
      body: "Platefy turns your restaurant website into an experience that answers, recommends and guides every guest, in their language.",
      demo: "See a demo",
      talk: "Talk to us",
      trust: "No apps. No friction. On your own website.",
      stageLabel: "Interactive Platefy assistant demo",
      instant: "Answers instantly",
      instantQuestion: "Do you have dairy-free options?",
      instantAnswer: "Yes — I can suggest three.",
      language: "In their language",
      languageQuestion: "¿Tenéis opciones veganas?",
      languageAnswer: "Sí. Aquí tienes tres platos.",
      scroll: "Discover Platefy",
    },
    conversation: {
      title: "A conversation that knows your restaurant.",
      body: "Menu, ingredients, hours, location and style of food. Platefy answers with real context so every guest can choose better.",
      steps: ["Ask", "Understand", "Recommend"],
      client: "Guest",
      question: "Do you have vegetarian, dairy-free options?",
      answer: "Yes. I match the menu with your preferences and allergens.",
      recommendation: "I recommend this:",
      dish: "Quinoa and avocado salad",
      tags: ["Vegan", "Dairy free", "Fresh"],
    },
    capabilities: {
      title: "Everything your team knows. Available instantly.",
      items: ["Smart menu", "Voice and chat", "Recommendations", "Multilingual", "Budget", "Allergens and diets"],
      benefit: "Fewer doubts. More confidence. Better decisions.",
    },
    menuBuilder: {
      title: "Need a new menu?",
      body: "We design it, organise it and make it ready for Platefy to understand from day one.",
      label: "Tell us what your restaurant needs",
      placeholder: "E.g. a clear menu with allergens, prices and well-organised recommendations.",
      submit: "Prepare my menu",
      submitted: "Menu prepared",
      note: "We can also connect the menu you already have.",
      before: "Before",
      after: "After",
      paperTitle: "Our menu",
      assistantTitle: "How can we help?",
      previewQuestion: "What vegetarian options do you have?",
      previewAnswer: "I have three options that suit you.",
    },
    faq: {
      title: "Questions that usually come up before starting.",
      items: [
        {
          question: "Do I need to change my website?",
          answer: "No. Platefy integrates with your current website and keeps your brand experience intact.",
        },
        {
          question: "How does Platefy learn my menu?",
          answer: "We connect your menu, hours, location and venue rules. You decide what it knows and when it is updated.",
        },
        {
          question: "Does it work in multiple languages?",
          answer: "Yes. It can serve guests in multiple languages while keeping the menu and restaurant context.",
        },
      ],
    },
    cta: {
      titleStart: "Let every visit begin with",
      titleAccent: "a great answer.",
      demo: "See a demo",
      talk: "Talk to us",
    },
    footer: {
      product: "Product",
      contact: "Contact",
      note: "AI for restaurants, embedded in your own website.",
    },
    demo: {
      label: "Platefy demo",
      title: "Ask as if you were already at the table.",
      intro: "This is a local simulation of how Platefy understands a menu and recommends with context.",
      close: "Close demo",
      input: "Ask something about the menu…",
      send: "Send question",
      suggestions: ["What can I eat gluten-free?", "Recommend something light", "Any options under €15?"],
      answer: "Of course. I recommend the quinoa and avocado salad: it is fresh, gluten-free and can be adapted to your preferences.",
      typing: "Platefy is thinking…",
    },
  },
  ca: {
    localeName: "Català",
    nav: {
      product: "Producte",
      how: "Com funciona",
      benefits: "Beneficis",
      faq: "FAQ",
      demo: "Veure una demo",
      openMenu: "Obrir menú",
      closeMenu: "Tancar menú",
      chooseLanguage: "Triar idioma",
    },
    hero: {
      title: ["La teva carta,", "ara sap", "conversar."],
      body: "Platefy converteix el web del teu restaurant en una experiència que respon, recomana i acompanya cada client, en el seu idioma.",
      demo: "Veure una demo",
      talk: "Parlar amb nosaltres",
      trust: "Sense apps. Sense fricció. Al teu propi web.",
      stageLabel: "Demo interactiva de l'assistent Platefy",
      instant: "Respon a l'instant",
      instantQuestion: "Teniu opcions sense lactosa?",
      instantAnswer: "Sí, i et puc recomanar tres.",
      language: "En el seu idioma",
      languageQuestion: "Do you have vegan options?",
      languageAnswer: "Yes. Here are three dishes.",
      scroll: "Descobrir Platefy",
    },
    conversation: {
      title: "Una conversa que coneix el teu restaurant.",
      body: "Carta, ingredients, horaris, ubicació i estil de cuina. Platefy respon amb context real perquè cada client decideixi millor.",
      steps: ["Pregunta", "Entén", "Recomana"],
      client: "Client",
      question: "Teniu opcions vegetarianes sense lactosa?",
      answer: "Sí. Creuo la carta amb les teves preferències i al·lèrgens.",
      recommendation: "Et recomano aquesta opció:",
      dish: "Amanida de quinoa i alvocat",
      tags: ["Vegà", "Sense lactosa", "Fresc"],
    },
    capabilities: {
      title: "Tot el que sap el teu equip. Disponible a l'instant.",
      items: ["Menú intel·ligent", "Veu i xat", "Recomanacions", "Multidioma", "Pressupost", "Al·lèrgens i dietes"],
      benefit: "Menys dubtes. Més confiança. Millors decisions.",
    },
    menuBuilder: {
      title: "Necessites una carta nova?",
      body: "La dissenyem, l'ordenem i la deixem preparada perquè Platefy l'entengui des del primer dia.",
      label: "Explica'ns què necessita el teu restaurant",
      placeholder: "Ex. una carta clara, amb al·lèrgens, preus i recomanacions ben organitzades.",
      submit: "Preparar la meva carta",
      submitted: "Carta preparada",
      note: "També podem connectar la carta que ja tens.",
      before: "Abans",
      after: "Després",
      paperTitle: "La nostra carta",
      assistantTitle: "Com et podem ajudar?",
      previewQuestion: "Quines opcions vegetarianes teniu?",
      previewAnswer: "Tinc tres opcions que encaixen amb tu.",
    },
    faq: {
      title: "Preguntes que solen aparèixer abans de començar.",
      items: [
        {
          question: "He de canviar el meu web?",
          answer: "No. Platefy s'integra al teu web actual i manté l'experiència de la teva marca.",
        },
        {
          question: "Com aprèn Platefy la meva carta?",
          answer: "Connectem la carta, els horaris, la ubicació i les regles del local. Tu decideixes què sap i quan s'actualitza.",
        },
        {
          question: "Funciona en diversos idiomes?",
          answer: "Sí. Pot atendre en diversos idiomes i conservar el context de la carta i del restaurant.",
        },
      ],
    },
    cta: {
      titleStart: "Fes que cada visita comenci amb",
      titleAccent: "una bona resposta.",
      demo: "Veure una demo",
      talk: "Parlar amb nosaltres",
    },
    footer: {
      product: "Producte",
      contact: "Contacte",
      note: "IA per a restaurants, integrada al teu propi web.",
    },
    demo: {
      label: "Demo de Platefy",
      title: "Pregunta com si ja fossis a taula.",
      intro: "Aquesta demo és una simulació local de com Platefy entén la carta i recomana amb context.",
      close: "Tancar demo",
      input: "Escriu una pregunta sobre la carta…",
      send: "Enviar pregunta",
      suggestions: ["Què puc menjar sense gluten?", "Recomana'm alguna cosa lleugera", "Teniu opcions per menys de 15 €?"],
      answer: "És clar. Et recomano l'amanida de quinoa i alvocat: és fresca, sense gluten i la puc adaptar a les teves preferències.",
      typing: "Platefy està pensant…",
    },
  },
};
