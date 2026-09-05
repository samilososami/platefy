import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, AudioLines, BookOpen, ChevronDown, Globe2, Leaf, Menu, MessageCircle, Sparkles, UsersRound, Wallet, X } from 'lucide-react';
import { content, type Locale } from './content';
import { assetUrl, Brand, LanguageSelect, Orb } from './ui';
import './landing.css';

const editorial = {
  es: {
    try: 'Probar Platefy', meet: 'Conoce a Platefy', discover: 'Descubre cómo funciona',
    intro: 'La hospitalidad empieza antes de llegar a la mesa. Un asistente que conoce tu restaurante y cuida de cada conversación.',
    trust: 'Sin apps. En tu web. En cualquier idioma.', question: '¿Algo ligero para cenar?', answer: 'Tengo algo que te va a encantar.',
    bridge: 'Pensado para tu restaurante.', bridgeAccent: 'Hecho para tus clientes.',
    context: 'Carta, ingredientes, horarios y preferencias. Todo lo que tu equipo sabe, en una conversación natural.',
    sampleQuestion: '¿Qué me recomiendas sin lactosa?', sampleAnswer: 'Algo fresco, lleno de sabor y pensado para ti.',
    featureTitles: ['Tu carta, bien entendida', 'La atención que te representa'],
    featureBodies: ['Cada plato, ingrediente y preparación, para ayudar a elegir con contexto.', 'Respuestas naturales, tono cercano y la esencia de tu restaurante.'],
    capabilityBodies: ['Tu carta lista para cada conversación.', 'Cada cliente elige cómo conversar.', 'Sugerencias que encajan con sus gustos.', 'La misma atención, en su idioma.', 'Opciones según lo que quiere gastar.', 'Ingredientes claros para decidir mejor.'],
    natural: 'Así de natural.', steps: ['El comensal pregunta desde tu web, con sus propias palabras. Como si ya estuviera en la mesa.', 'Platefy conecta la pregunta con tu carta, tus horarios y el contexto de la conversación.', 'Una respuesta útil. Un plato que encaja. Un cliente con más ganas de conocerte.'],
    faq: 'Hablemos claro.', closing: 'Cada gran experiencia empieza con una buena', closingAccent: 'conversación.',
    preview: 'Una nueva forma de dar la bienvenida.', photo: 'Una mesa para dos en un restaurante mediterráneo bañado por la luz de la tarde', example: 'Ejemplo de conversación',
  },
  en: {
    try: 'Try Platefy', meet: 'Meet Platefy', discover: 'Discover how it works',
    intro: 'Hospitality begins before your guests reach the table. An assistant that knows your restaurant and cares for every conversation.',
    trust: 'No apps. On your website. In any language.', question: 'Something light for dinner?', answer: 'I have something you will love.',
    bridge: 'Designed for your restaurant.', bridgeAccent: 'Made for your guests.',
    context: 'Your menu, ingredients, opening hours and preferences. Everything your team knows, in a natural conversation.',
    sampleQuestion: 'What would you suggest without dairy?', sampleAnswer: 'Something fresh, full of flavour, and just right for you.',
    featureTitles: ['Your menu, understood', 'Service that feels like you'],
    featureBodies: ['Every dish, ingredient and preparation, to help guests choose with context.', 'Natural answers, a welcoming tone and the personality of your restaurant.'],
    capabilityBodies: ['Your menu, ready for every conversation.', 'Let your guests choose how to talk.', 'Suggestions that fit their tastes.', 'The same welcome, in their language.', 'Options that fit their budget.', 'Clear ingredients for better decisions.'],
    natural: 'Naturally simple.', steps: ['Your guest asks a question on your website, in their own words. As if they were already at the table.', 'Platefy connects the question with your menu, your opening hours and the conversation.', 'A helpful answer. A dish that fits. A guest who cannot wait to meet you.'],
    faq: 'Let’s talk.', closing: 'Every great experience begins with a good', closingAccent: 'conversation.',
    preview: 'A new way to make people feel welcome.', photo: 'A sunlit table for two in a contemporary Mediterranean restaurant', example: 'Example conversation',
  },
  ca: {
    try: 'Prova Platefy', meet: 'Coneix Platefy', discover: 'Descobreix com funciona',
    intro: 'L’hospitalitat comença abans d’arribar a taula. Un assistent que coneix el teu restaurant i cuida cada conversa.',
    trust: 'Sense apps. Al teu web. En qualsevol idioma.', question: 'Alguna cosa lleugera per sopar?', answer: 'Tinc una proposta que t’encantarà.',
    bridge: 'Pensat per al teu restaurant.', bridgeAccent: 'Fet per als teus clients.',
    context: 'Carta, ingredients, horaris i preferències. Tot el que sap el teu equip, en una conversa natural.',
    sampleQuestion: 'Què em recomanes sense lactosa?', sampleAnswer: 'Una proposta fresca, plena de sabor i pensada per a tu.',
    featureTitles: ['La teva carta, ben entesa', 'L’atenció que et representa'],
    featureBodies: ['Cada plat, ingredient i preparació, per ajudar a triar amb context.', 'Respostes naturals, un to proper i l’essència del teu restaurant.'],
    capabilityBodies: ['La teva carta, a punt per a cada conversa.', 'Cada client tria com conversar.', 'Propostes que encaixen amb els seus gustos.', 'La mateixa atenció, en el seu idioma.', 'Opcions segons el que vol gastar.', 'Ingredients clars per decidir millor.'],
    natural: 'Així de natural.', steps: ['El comensal pregunta des del teu web, amb les seves paraules. Com si ja fos a taula.', 'Platefy connecta la pregunta amb la carta, els horaris i el context de la conversa.', 'Una resposta útil. Un plat que encaixa. Un client amb més ganes de conèixer-te.'],
    faq: 'Parlem clar.', closing: 'Cada gran experiència comença amb una bona', closingAccent: 'conversa.',
    preview: 'Una nova manera de donar la benvinguda.', photo: 'Una taula per a dos en un restaurant mediterrani amb llum de tarda', example: 'Exemple de conversa',
  },
};
const capabilityIcons = [BookOpen, AudioLines, Sparkles, Globe2, Wallet, Leaf];

export default function Landing({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (value: Locale) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const site = useRef<HTMLDivElement>(null);
  const t = content[locale];
  const e = editorial[locale];
  useEffect(() => {
    const nodes = site.current?.querySelectorAll('.reveal');
    if (!nodes || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    nodes.forEach(node => { node.classList.add('will-reveal'); observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    site.current?.querySelector<HTMLAnchorElement>('.site-nav a')?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); site.current?.querySelector<HTMLButtonElement>('.mobile-menu')?.focus(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  return <div className="site" ref={site}>
    <a className="skip-link" href="#main">{locale === 'en' ? 'Skip to content' : locale === 'ca' ? 'Ves al contingut' : 'Saltar al contenido'}</a>
    <header className="site-header">
      <Brand />
      <nav className={`site-nav ${menuOpen ? 'is-open' : ''}`} id="site-navigation" aria-label={t.nav.product}>
        <a href="#producto" onClick={() => setMenuOpen(false)}>{t.nav.product}</a>
        <a href="#como-funciona" onClick={() => setMenuOpen(false)}>{t.nav.how}</a>
        <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
      </nav>
      <div className="header-actions"><LanguageSelect locale={locale} onChange={onLocaleChange} /><a className="button button-dark header-cta" href="./chatbot/">{e.try}<ArrowUpRight size={18} /></a><button className="icon-button mobile-menu" aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">{t.hero.title.slice(0, -1).map(line => <span key={line}>{line}</span>)}<em>{t.hero.title[t.hero.title.length - 1]}</em></h1>
          <p>{e.intro}</p>
          <div className="hero-actions"><a href="./chatbot/" className="button button-dark">{e.meet}<ArrowRight size={21} /></a><a className="text-link" href="#como-funciona">{e.discover}</a></div>
          <span className="hero-footnote">{e.trust}</span>
        </div>
        <div className="hero-scene" aria-label={e.example}>
          <Orb className="hero-orb" state="idle" />
          <div className="hero-bubble bubble-question">{e.question}</div>
          <div className="hero-bubble bubble-answer">{e.answer}</div>
        </div>
      </section>
      <div className="hero-bridge"><span>{e.bridge} <span>{e.bridgeAccent}</span></span><ArrowRight aria-hidden="true" strokeWidth={1.2} /></div>

      <section id="producto" className="product-section section-space">
        <div className="section-heading reveal"><h2>{t.conversation.title}</h2><p>{e.context}</p></div>
        <div className="product-story reveal">
          <div className="restaurant-image"><img src={assetUrl('images/restaurant-editorial.webp')} alt={e.photo} width="1536" height="1024" loading="lazy" /></div>
          <div className="product-conversation" aria-label={e.example}>
            <div className="example-question">{e.sampleQuestion}</div>
            <div className="example-response"><Orb className="example-orb" /><div><span className="response-name">Platefy</span><p>{e.sampleAnswer}</p></div></div>
          </div>
        </div>
        <div className="feature-pair reveal">{[BookOpen, UsersRound].map((Icon, index) => <div className="feature" key={index}><Icon strokeWidth={1.3} /><div><h3>{e.featureTitles[index]}</h3><p>{e.featureBodies[index]}</p></div></div>)}</div>
        <div id="beneficios" className="capability-list reveal">{t.capabilities.items.map((label, index) => { const Icon = capabilityIcons[index]; return <div className="capability" key={label}><Icon strokeWidth={1.4} /><div><h3>{label}</h3><p>{e.capabilityBodies[index]}</p></div></div>; })}</div>
      </section>

      <section id="como-funciona" className="how-section section-space">
        <h2 className="reveal">{e.natural}</h2>
        <div className="steps">{t.conversation.steps.map((step, index) => <article className="step reveal" key={step}><div className="step-number"><span>0{index + 1}</span><i /></div><h3>{step}.</h3><p>{e.steps[index]}</p></article>)}</div>
      </section>
      <section className="menu-service"><div className="menu-service-inner reveal"><div><BookOpen strokeWidth={1.1} /><h2>{t.menuBuilder.title}</h2></div><p>{t.menuBuilder.body} {t.menuBuilder.note}</p></div></section>
      <section className="faq-section section-space" id="faq"><h2 className="reveal">{e.faq}</h2><div className="faq-list reveal">{t.faq.items.map((item, index) => <details key={`${locale}-${index}`} name="platefy-faq"><summary>{item.question}<ChevronDown size={20} strokeWidth={1.3} /></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="closing-section"><div className="closing-main"><h2>{e.closing} <em>{e.closingAccent}</em></h2><a className="button button-accent" href="./chatbot/">{e.meet}<ArrowRight size={22} /></a></div><footer className="site-footer"><Brand /><p>{t.footer.note}</p><a href="./chatbot/" aria-label={e.try}><MessageCircle size={20} /><span>{e.preview}</span><ArrowUpRight size={16} /></a></footer></section>
    </main>
  </div>;
}
