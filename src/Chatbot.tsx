import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, Clock3, Info, Leaf, Menu, Mic, Plus, RotateCcw, Square, Store, Users, Volume2, VolumeX, X } from 'lucide-react';
import type { Locale } from './content';
import { Brand, LanguageSelect, Orb, type OrbState } from './ui';
import { AI_PROVIDERS, generateReply, providerErrorMessage, synthesizeSpeech, ProviderError, type ChatMessage } from './services/ai';
import { menu } from './services/restaurant';
import './chatbot.css';

const copy = {
  es: {
    table: 'La mesa de Platefy', sample: 'Restaurante de muestra', newChat: 'Nueva conversación', about: 'Sobre la mesa', menu: 'Carta del restaurante', hours: 'Horarios y local', back: 'Volver a Platefy', sound: 'Sonido', soundOn: 'Activar respuestas por voz', soundOff: 'Desactivar respuestas por voz',
    welcome: 'Hola. Soy Platefy.', welcomeBody: 'Una buena conversación abre el apetito.', welcomeNote: 'Estoy aquí para ayudarte a descubrir la carta.', start: 'Tomar asiento', voicePreview: 'Escuchar mi voz', title: '¿Qué te apetece hoy?', subtitle: 'Conozco la carta. Cuéntame qué te gusta.', suggestions: ['Algo ligero', 'Opciones vegetarianas', 'Una mesa para dos'], prompts: ['¿Qué plato ligero me recomiendas?', '¿Qué opciones vegetarianas tenéis?', 'Me gustaría una mesa para dos. ¿Cómo funciona?'],
    placeholder: 'Pregunta, descubre, déjate recomendar…', input: 'Tu mensaje', send: 'Enviar mensaje', listen: 'Hablar con Platefy', useTranscript: 'Usar transcripción', cancel: 'Cancelar', stop: 'Detener respuesta', close: 'Cerrar', openNavigation: 'Abrir navegación', listening: 'Te escucho…', requestingMic: 'Esperando permiso de micrófono…', listeningHint: 'Después podrás revisar el texto antes de enviarlo.', noTranscript: 'Empieza a hablar. Tu voz aparecerá aquí.', thinking: 'Estoy pensando en tu próxima recomendación…', speaking: 'Hablando', loadingAudio: 'Preparando la voz…', ready: 'Aquí para ayudarte', read: 'Escuchar respuesta', stopAudio: 'Detener audio',
    disclaimer: 'Restaurante de muestra · Las reservas no se confirman desde esta experiencia.', details: 'Detalles', detailsTitle: 'Una conversación, con contexto.', detailsBody: 'Esta experiencia utiliza una carta ficticia. Las respuestas se generan con IA en la nube y pueden contener errores.', provider: 'Inteligencia y voz', providerBody: 'Las preguntas se envían a un modelo alojado en Hugging Face. Si activas la voz, también se envía el texto de la respuesta al servicio de voz. Los servicios gratuitos tienen disponibilidad y cuotas compartidas.', privacy: 'Evita compartir datos personales. La conversación permanece en esta pestaña y desaparece al recargar.', retry: 'Volver a intentar', dismiss: 'Cerrar aviso', micUnsupported: 'Este navegador no ofrece reconocimiento de voz. Puedes seguir escribiendo o probar con Chrome.', micDenied: 'No se ha permitido el micrófono. Puedes habilitarlo en tu navegador o seguir escribiendo.', micError: 'No he podido escuchar tu voz. Puedes volver a intentarlo o escribir tu pregunta.', micNoSpeech: 'No he oído ninguna voz. Puedes intentarlo de nuevo.', audioError: 'El audio no se ha podido reproducir. Pulsa Escuchar respuesta para volver a intentarlo.',
    menuIntro: 'Cuatro platos, muchas formas de encontrar tu favorito.', vegan: 'Vegano', vegetarian: 'Vegetariano', milk: 'Contiene leche', allergy: 'Las recetas son de muestra. La ausencia de alérgenos y las trazas deben confirmarse con el equipo de un restaurante real.', hoursIntro: 'Una mesa mediterránea para imaginar tu próxima visita.', lunch: 'Comidas', dinner: 'Cenas', location: 'Sobre este local', locationBody: 'Este restaurante es ficticio. No hay una dirección ni un teléfono reales asociados.', reservations: 'Reservas', reservationsBody: 'Puedes preguntar cómo sería una reserva, pero esta experiencia no consulta disponibilidad ni confirma mesas.', you: 'Tú', voiceHint: 'Voz natural en español e inglés',
  },
  en: {
    table: 'The Platefy table', sample: 'Sample restaurant', newChat: 'New conversation', about: 'Around the table', menu: 'Restaurant menu', hours: 'Hours & restaurant', back: 'Back to Platefy', sound: 'Sound', soundOn: 'Enable spoken replies', soundOff: 'Disable spoken replies',
    welcome: 'Hello. I’m Platefy.', welcomeBody: 'A good conversation whets the appetite.', welcomeNote: 'I’m here to help you discover the menu.', start: 'Take a seat', voicePreview: 'Hear my voice', title: 'What are you in the mood for?', subtitle: 'I know the menu. Tell me what you love.', suggestions: ['Something light', 'Vegetarian options', 'A table for two'], prompts: ['Which light dish would you recommend?', 'What vegetarian options do you have?', 'I would like a table for two. How does it work?'],
    placeholder: 'Ask, discover, find your favourite…', input: 'Your message', send: 'Send message', listen: 'Talk to Platefy', useTranscript: 'Use transcript', cancel: 'Cancel', stop: 'Stop response', close: 'Close', openNavigation: 'Open navigation', listening: 'I’m listening…', requestingMic: 'Waiting for microphone permission…', listeningHint: 'You can review the text before sending it.', noTranscript: 'Start speaking. Your words will appear here.', thinking: 'Thinking about your next recommendation…', speaking: 'Speaking', loadingAudio: 'Preparing the voice…', ready: 'Here to help', read: 'Listen to reply', stopAudio: 'Stop audio',
    disclaimer: 'Sample restaurant · Reservations are not confirmed in this experience.', details: 'Details', detailsTitle: 'A conversation, with context.', detailsBody: 'This experience uses a fictional menu. Responses are generated by cloud AI and may contain errors.', provider: 'Intelligence & voice', providerBody: 'Questions are sent to a model hosted on Hugging Face. If you enable sound, reply text is also sent to the voice service. Free services have shared availability and quotas.', privacy: 'Avoid sharing personal information. The conversation stays in this tab and disappears when you reload.', retry: 'Try again', dismiss: 'Dismiss notice', micUnsupported: 'This browser does not offer voice recognition. You can keep typing or try Chrome.', micDenied: 'Microphone access was not allowed. You can enable it in your browser or keep typing.', micError: 'I could not hear your voice. You can try again or type your question.', micNoSpeech: 'I did not hear any speech. You can try again.', audioError: 'The audio could not play. Select Listen to reply to try again.',
    menuIntro: 'Four dishes. Plenty of ways to find a favourite.', vegan: 'Vegan', vegetarian: 'Vegetarian', milk: 'Contains milk', allergy: 'These are sample recipes. Allergens and cross-contamination must be checked with the team at a real restaurant.', hoursIntro: 'A Mediterranean table to imagine your next visit.', lunch: 'Lunch', dinner: 'Dinner', location: 'About this restaurant', locationBody: 'This restaurant is fictional. It has no real address or phone number.', reservations: 'Reservations', reservationsBody: 'You can ask how a booking would work, but this experience does not check availability or confirm tables.', you: 'You', voiceHint: 'Natural voice in Spanish and English',
  },
  ca: {
    table: 'La taula de Platefy', sample: 'Restaurant de mostra', newChat: 'Nova conversa', about: 'Sobre la taula', menu: 'Carta del restaurant', hours: 'Horaris i local', back: 'Tornar a Platefy', sound: 'So', soundOn: 'Activar respostes amb veu', soundOff: 'Desactivar respostes amb veu',
    welcome: 'Hola. Soc Platefy.', welcomeBody: 'Una bona conversa obre la gana.', welcomeNote: 'Soc aquí per ajudar-te a descobrir la carta.', start: 'Seure a taula', voicePreview: 'Escoltar la meva veu', title: 'Què et ve de gust avui?', subtitle: 'Conec la carta. Explica’m què t’agrada.', suggestions: ['Alguna cosa lleugera', 'Opcions vegetarianes', 'Una taula per a dos'], prompts: ['Quin plat lleuger em recomanes?', 'Quines opcions vegetarianes teniu?', 'M’agradaria una taula per a dos. Com funciona?'],
    placeholder: 'Pregunta, descobreix, deixa’t recomanar…', input: 'El teu missatge', send: 'Enviar missatge', listen: 'Parlar amb Platefy', useTranscript: 'Utilitzar transcripció', cancel: 'Cancel·lar', stop: 'Aturar resposta', close: 'Tancar', openNavigation: 'Obrir navegació', listening: 'T’escolto…', requestingMic: 'Esperant permís del micròfon…', listeningHint: 'Després podràs revisar el text abans d’enviar-lo.', noTranscript: 'Comença a parlar. La teva veu apareixerà aquí.', thinking: 'Pensant en la teva pròxima recomanació…', speaking: 'Parlant', loadingAudio: 'Preparant la veu…', ready: 'Soc aquí per ajudar-te', read: 'Escoltar resposta', stopAudio: 'Aturar àudio',
    disclaimer: 'Restaurant de mostra · Les reserves no es confirmen des d’aquesta experiència.', details: 'Detalls', detailsTitle: 'Una conversa, amb context.', detailsBody: 'Aquesta experiència utilitza una carta fictícia. Les respostes es generen amb IA al núvol i poden contenir errors.', provider: 'Intel·ligència i veu', providerBody: 'Les preguntes s’envien a un model allotjat a Hugging Face. Si actives la veu, també s’envia el text de la resposta al servei de veu. Els serveis gratuïts tenen disponibilitat i quotes compartides.', privacy: 'Evita compartir dades personals. La conversa es queda en aquesta pestanya i desapareix en recarregar.', retry: 'Tornar-ho a provar', dismiss: 'Tancar avís', micUnsupported: 'Aquest navegador no ofereix reconeixement de veu. Pots continuar escrivint o provar Chrome.', micDenied: 'No s’ha permès el micròfon. Pots habilitar-lo al navegador o continuar escrivint.', micError: 'No he pogut escoltar la teva veu. Pots tornar-ho a provar o escriure la pregunta.', micNoSpeech: 'No he sentit cap veu. Pots tornar-ho a provar.', audioError: 'No s’ha pogut reproduir l’àudio. Prem Escoltar resposta per tornar-ho a provar.',
    menuIntro: 'Quatre plats, moltes maneres de trobar el teu preferit.', vegan: 'Vegà', vegetarian: 'Vegetarià', milk: 'Conté llet', allergy: 'Les receptes són de mostra. Cal confirmar els al·lèrgens i les traces amb l’equip d’un restaurant real.', hoursIntro: 'Una taula mediterrània per imaginar la pròxima visita.', lunch: 'Dinars', dinner: 'Sopars', location: 'Sobre aquest local', locationBody: 'Aquest restaurant és fictici. No té cap adreça ni telèfon reals associats.', reservations: 'Reserves', reservationsBody: 'Pots preguntar com seria una reserva, però aquesta experiència no consulta disponibilitat ni confirma taules.', you: 'Tu', voiceHint: 'Veu natural en castellà i anglès',
  },
} as const;

type Copy = typeof copy[Locale];
type DisplayMessage = ChatMessage & { id: string };
type Panel = 'navigation' | 'menu' | 'hours' | 'details' | null;
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
const suggestionIcons = [Leaf, Leaf, Users];
const makeMessage = (role: ChatMessage['role'], content: string): DisplayMessage => ({ role, content, id: crypto.randomUUID() });

function releaseRecognition(recognition: SpeechRecognitionLike | null, mode: 'abort' | 'stop' = 'abort') {
  if (!recognition) return;
  // A late native onstart/onend must never revive a cancelled listening session.
  recognition.onstart = null; recognition.onresult = null; recognition.onerror = null; recognition.onend = null;
  try { recognition[mode](); } catch {
    // Chromium can throw if the session already ended or permission is pending.
    try { recognition[mode === 'abort' ? 'stop' : 'abort'](); } catch { /* Already inactive. */ }
  }
}

function useConversation(locale: Locale) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const messagesRef = useRef<DisplayMessage[]>([]);
  const generationRef = useRef<AbortController | null>(null);
  const speechRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef(new Map<string, string>());
  const retryRef = useRef<DisplayMessage[]>([]);
  const soundRef = useRef(false);
  const liveRef = useRef(true);
  const c = copy[locale];

  const stopAudio = useCallback(() => {
    speechRef.current?.abort(); speechRef.current = null;
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    audioRef.current = null;
    if (liveRef.current) { setAudioState('idle'); setActiveAudio(null); }
  }, []);

  const stopGeneration = useCallback(() => {
    generationRef.current?.abort(); generationRef.current = null;
    if (liveRef.current) setGenerating(false);
  }, []);

  useEffect(() => {
    liveRef.current = true;
    return () => { liveRef.current = false; stopGeneration(); stopAudio(); };
  }, [stopAudio, stopGeneration]);

  const playMessage = useCallback(async (message: DisplayMessage) => {
    stopAudio(); setNotice(null); setCanRetry(false);
    const controller = new AbortController(); speechRef.current = controller;
    setAudioState('loading'); setActiveAudio(message.id);
    try {
      const cacheKey = `${locale}:${message.id}`;
      const src = audioCache.current.get(cacheKey) ?? await synthesizeSpeech(message.content, locale, controller.signal);
      if (controller.signal.aborted || !liveRef.current) return;
      audioCache.current.set(cacheKey, src);
      const audio = new Audio();
      audio.crossOrigin = 'anonymous'; audio.src = src; audioRef.current = audio;
      audio.onended = () => { if (audioRef.current === audio && liveRef.current) { setAudioState('idle'); setActiveAudio(null); audioRef.current = null; } };
      audio.onerror = () => { if (audioRef.current === audio && liveRef.current) { audioCache.current.delete(cacheKey); setNotice(c.audioError); stopAudio(); } };
      await audio.play();
      if (!controller.signal.aborted && liveRef.current) setAudioState('playing');
    } catch (error) {
      if (controller.signal.aborted || !liveRef.current) return;
      setNotice(error instanceof DOMException ? c.audioError : providerErrorMessage(error, locale));
      stopAudio();
    }
  }, [c.audioError, locale, stopAudio]);

  const requestReply = useCallback(async (history: DisplayMessage[]) => {
    stopGeneration(); stopAudio(); setNotice(null); setCanRetry(false);
    const controller = new AbortController(); generationRef.current = controller;
    retryRef.current = history; setGenerating(true);
    try {
      const answer = await generateReply(history.map(({ role, content }) => ({ role, content })), locale, controller.signal);
      if (controller.signal.aborted || !liveRef.current) return;
      const reply = makeMessage('assistant', answer);
      const next = [...history, reply]; messagesRef.current = next; setMessages(next);
      generationRef.current = null; setGenerating(false);
      if (soundRef.current) void playMessage(reply);
    } catch (error) {
      if (controller.signal.aborted || !liveRef.current) return;
      generationRef.current = null; setGenerating(false);
      setNotice(providerErrorMessage(error, locale)); setCanRetry(true);
    }
  }, [locale, playMessage, stopAudio, stopGeneration]);

  const send = useCallback((question: string) => {
    if (!question.trim() || generationRef.current) return false;
    const history = [...messagesRef.current, makeMessage('user', question.trim())];
    messagesRef.current = history; setMessages(history); void requestReply(history); return true;
  }, [requestReply]);

  const reset = useCallback(() => {
    stopGeneration(); stopAudio(); messagesRef.current = []; retryRef.current = []; audioCache.current.clear();
    setMessages([]); setNotice(null); setCanRetry(false);
  }, [stopAudio, stopGeneration]);

  const changeLanguage = useCallback(() => { stopGeneration(); stopAudio(); setNotice(null); setCanRetry(false); }, [stopAudio, stopGeneration]);
  const showNotice = (message: string | null) => { setNotice(message); setCanRetry(false); };
  const toggleSound = () => {
    const next = !soundRef.current;
    if (next && locale === 'ca') { setNotice(providerErrorMessage(new ProviderError('UNSUPPORTED_LANGUAGE', 'Catalan voice is unavailable.'), locale)); return; }
    soundRef.current = next; setSound(next); if (!next) stopAudio();
  };
  return { messages, generating, audioState, activeAudio, sound, notice, canRetry, send, reset, stopGeneration, stopAudio, playMessage, changeLanguage, toggleSound, setNotice: showNotice, dismiss: () => showNotice(null), retry: () => void requestReply(retryRef.current) };
}

function Sidebar({ c, onPanel, onReset, home }: { c: Copy; onPanel: (panel: Panel) => void; onReset: () => void; home: string }) {
  return <>
    <div className="chat-rail-brand"><Brand href={home} /></div>
    <button className="chat-new" onClick={onReset}><Plus size={20} aria-hidden="true" />{c.newChat}</button>
    <div className="chat-nav-group"><p>{c.about}</p><nav aria-label={c.about}>
      <button onClick={() => onPanel('menu')}><BookOpen size={20} aria-hidden="true" />{c.menu}</button>
      <button onClick={() => onPanel('hours')}><Clock3 size={21} aria-hidden="true" />{c.hours}</button>
    </nav></div>
    <div className="chat-rail-bottom"><button onClick={() => onPanel('details')}><Store size={20} aria-hidden="true" />{c.sample}</button><a href={home}><ArrowLeft size={20} aria-hidden="true" />{c.back}</a></div>
  </>;
}

function InformationPanel({ panel, onClose, onPanel, onReset, locale, home }: { panel: Exclude<Panel, null>; onClose: () => void; onPanel: (panel: Panel) => void; onReset: () => void; locale: Locale; home: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const c = copy[locale];
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { if (dialog?.open) dialog.close(); }; }, []);
  const title = panel === 'menu' ? c.menu : panel === 'hours' ? c.hours : panel === 'navigation' ? 'Platefy' : c.detailsTitle;
  return <dialog ref={ref} className={`chat-dialog chat-dialog--${panel}`} aria-labelledby="chat-panel-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="chat-dialog-inner">
      <header className="chat-dialog-header"><h2 id="chat-panel-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label={c.close}><X size={20} /></button></header>
      {panel === 'navigation' ? <div className="chat-mobile-nav"><Sidebar c={c} onPanel={onPanel} onReset={onReset} home={home} /></div> : null}
      {panel === 'menu' ? <><p className="chat-dialog-intro">{c.menuIntro}</p><div className="chat-menu-list">{menu.map(dish => <article className="chat-menu-dish" key={dish.id}><div className="chat-dish-heading"><h3>{dish.name[locale]}</h3><span>{new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(dish.price)}</span></div><p>{dish.description[locale]}</p><div className="chat-dish-tags"><span><Leaf size={13} aria-hidden="true" />{dish.vegan ? c.vegan : c.vegetarian}</span>{dish.allergens.length > 0 ? <span>{c.milk}</span> : null}</div></article>)}</div><p className="chat-panel-note"><Info size={17} aria-hidden="true" />{c.allergy}</p></> : null}
      {panel === 'hours' ? <><p className="chat-dialog-intro">{c.hoursIntro}</p><div className="chat-hours"><div><span>{c.lunch}</span><strong>13:00 — 16:00</strong></div><div><span>{c.dinner}</span><strong>20:00 — 23:30</strong></div></div><section className="chat-info-section"><h3>{c.location}</h3><p>{c.locationBody}</p></section><section className="chat-info-section"><h3>{c.reservations}</h3><p>{c.reservationsBody}</p></section></> : null}
      {panel === 'details' ? <><p className="chat-dialog-intro">{c.detailsBody}</p><section className="chat-info-section"><h3>{c.provider}</h3><p>{c.providerBody}</p><div className="chat-provider-links"><a href={AI_PROVIDERS.chat.space} target="_blank" rel="noreferrer">{AI_PROVIDERS.chat.name}<ArrowUpRight size={15} /></a><a href={AI_PROVIDERS.speech.space} target="_blank" rel="noreferrer">Kokoro · ES<ArrowUpRight size={15} /></a><a href={AI_PROVIDERS.speechEnglish.space} target="_blank" rel="noreferrer">Kokoro · EN<ArrowUpRight size={15} /></a></div><p>{c.voiceHint}</p></section><p className="chat-panel-note"><Info size={17} aria-hidden="true" />{c.privacy}</p></> : null}
    </div>
  </dialog>;
}

function MessageText({ text }: { text: string }) {
  return <div className="chat-message-text">{text.split(/\n{2,}/).map((paragraph, i) => <p key={i}>{paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}</p>)}</div>;
}

export default function Chatbot({ locale, onLocaleChange }: { locale: Locale; onLocaleChange: (locale: Locale) => void }) {
  const c = copy[locale];
  const conversation = useConversation(locale);
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [appearing, setAppearing] = useState(true);
  const appRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recognitionEpoch = useRef(0);
  const draftBeforeListening = useRef('');
  const home = '../';

  useEffect(() => { const timer = window.setTimeout(() => setAppearing(false), 1250); return () => window.clearTimeout(timer); }, []);
  useEffect(() => {
    const app = appRef.current;
    const viewport = window.visualViewport;
    const syncHeight = () => app?.style.setProperty('--chat-height', `${Math.round(viewport?.height || window.innerHeight)}px`);
    syncHeight();
    viewport?.addEventListener('resize', syncHeight);
    window.addEventListener('resize', syncHeight);
    return () => {
      viewport?.removeEventListener('resize', syncHeight);
      window.removeEventListener('resize', syncHeight);
      app?.style.removeProperty('--chat-height');
    };
  }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous; recognitionEpoch.current += 1;
      const recognition = recognitionRef.current; recognitionRef.current = null;
      releaseRecognition(recognition);
    };
  }, []);
  useEffect(() => {
    const textarea = composerRef.current;
    if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 148)}px`; }
  }, [draft, started]);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [conversation.messages, conversation.generating, conversation.notice]);

  const finishRecognition = (mode: 'abort' | 'stop') => {
    const recognition = recognitionRef.current;
    recognitionEpoch.current += 1;
    recognitionRef.current = null;
    setListening(false); setRequestingMic(false);
    try { releaseRecognition(recognition, mode); } finally { setListening(false); }
  };
  const endListening = (cancel = false) => {
    if (cancel) setDraft(draftBeforeListening.current);
    finishRecognition(cancel ? 'abort' : 'stop');
  };
  const abortRecognition = () => finishRecognition('abort');
  const beginListening = () => {
    if (conversation.generating) return;
    const Recognition = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
    if (!Recognition) { conversation.setNotice(c.micUnsupported); return; }
    abortRecognition(); conversation.stopAudio(); conversation.dismiss();
    draftBeforeListening.current = draft;
    const epoch = ++recognitionEpoch.current;
    const recognition = new Recognition(); recognitionRef.current = recognition;
    recognition.lang = { es: 'es-ES', en: 'en-GB', ca: 'ca-ES' }[locale];
    recognition.continuous = true; recognition.interimResults = true;
    recognition.onstart = () => { if (epoch === recognitionEpoch.current) { setRequestingMic(false); setListening(true); } };
    recognition.onresult = event => {
      if (epoch !== recognitionEpoch.current) return;
      let transcript = ''; for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setDraft(transcript.trim());
    };
    recognition.onerror = event => {
      if (epoch !== recognitionEpoch.current || event.error === 'aborted') return;
      abortRecognition();
      conversation.setNotice(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? c.micDenied : event.error === 'no-speech' ? c.micNoSpeech : c.micError);
    };
    recognition.onend = () => { if (epoch === recognitionEpoch.current) { recognitionRef.current = null; setListening(false); setRequestingMic(false); } };
    try { setRequestingMic(true); recognition.start(); } catch { abortRecognition(); conversation.setNotice(c.micError); }
  };
  const send = (text: string) => { if (conversation.send(text)) { abortRecognition(); setDraft(''); } };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!listening && !requestingMic) send(draft); };
  const reset = () => { abortRecognition(); conversation.reset(); setDraft(''); setStarted(true); setPanel(null); };
  const openPanel = (next: Panel) => { abortRecognition(); conversation.stopAudio(); setPanel(next); };
  const changeLocale = (next: Locale) => { abortRecognition(); if (next === 'ca' && conversation.sound) conversation.toggleSound(); conversation.changeLanguage(); onLocaleChange(next); };
  const state: OrbState = appearing && !started ? 'appearing' : listening ? 'listening' : conversation.generating || conversation.audioState === 'loading' ? 'thinking' : conversation.audioState === 'playing' ? 'speaking' : conversation.notice ? 'error' : 'idle';
  const hasMessages = conversation.messages.length > 0;
  const welcomeMessage: DisplayMessage = { id: `welcome-${locale}`, role: 'assistant', content: `${c.welcome} ${c.welcomeNote}` };
  const welcomeAudioActive = conversation.activeAudio === welcomeMessage.id;

  return <div ref={appRef} className={`chat-app ${started ? 'chat-app--started' : 'chat-app--welcome'}`}>
    <aside className="chat-rail"><Sidebar c={c} onPanel={openPanel} onReset={reset} home={home} /></aside>
    <main className="chat-main" aria-label={c.table}>
      <header className="chat-header"><div className="chat-header-title"><button className="icon-button chat-menu-toggle" onClick={() => openPanel('navigation')} aria-label={c.openNavigation}><Menu size={21} /></button><div><h1>{c.table}</h1><p>{c.sample}</p></div></div><div className="chat-header-actions"><button className="chat-sound" onClick={conversation.toggleSound} aria-label={conversation.sound ? c.soundOff : c.soundOn} aria-pressed={conversation.sound} title={c.voiceHint}>{conversation.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>{c.sound}</span><i aria-hidden="true" className={conversation.sound ? 'is-on' : ''} /></button><LanguageSelect locale={locale} onChange={changeLocale} /></div></header>
      {!started ? <section className="chat-welcome"><Orb state={state} className="chat-welcome-orb" /><div className="chat-welcome-copy"><h2>{c.welcome}</h2><p>{c.welcomeBody}</p><span>{c.welcomeNote}</span></div><button className="button button-dark chat-start" onClick={() => { conversation.stopAudio(); setStarted(true); }}>{c.start}<ArrowRight size={18} aria-hidden="true" /></button><button type="button" className={`chat-voice-preview ${welcomeAudioActive ? 'chat-voice-preview--active' : ''}`} onClick={() => welcomeAudioActive ? conversation.stopAudio() : void conversation.playMessage(welcomeMessage)} aria-label={welcomeAudioActive ? c.stopAudio : c.voicePreview}>{welcomeAudioActive ? <Square size={12} fill="currentColor" aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}<span>{welcomeAudioActive ? conversation.audioState === 'loading' ? c.loadingAudio : c.stopAudio : c.voicePreview}</span></button><p className="chat-welcome-note">{c.sample}</p>{conversation.notice ? <p className="chat-welcome-notice" role="alert">{conversation.notice}</p> : null}</section> : <>
        <div className={`chat-scroll ${hasMessages ? 'chat-scroll--conversation' : ''}`} ref={scrollRef}>
          {!hasMessages ? <section className="chat-empty"><div className="chat-empty-orb-wrap"><span className="chat-orb-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span><Orb state={state} className="chat-empty-orb" /><span className="chat-orb-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span></div><h2>{c.title}</h2><p>{c.subtitle}</p><div className="chat-suggestions">{c.suggestions.map((suggestion, i) => { const Icon = suggestionIcons[i]; return <button key={suggestion} onClick={() => send(c.prompts[i])}><Icon size={23} strokeWidth={1.4} aria-hidden="true" /><span>{suggestion}</span><ArrowUpRight size={16} aria-hidden="true" /></button>; })}</div></section> : <div className="chat-thread"><div className="chat-presence"><Orb state={state} className="chat-presence-orb" /><span>{requestingMic ? c.requestingMic : listening ? c.listening : conversation.generating ? c.thinking : conversation.audioState === 'loading' ? c.loadingAudio : conversation.audioState === 'playing' ? c.speaking : c.ready}</span></div><div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions text">{conversation.messages.map(message => <article className={`chat-message chat-message--${message.role}`} key={message.id}><span className="sr-only">{message.role === 'user' ? c.you : 'Platefy'}</span>{message.role === 'assistant' ? <span className="chat-message-brand" aria-hidden="true">platefy</span> : null}<MessageText text={message.content} />{message.role === 'assistant' ? <button className={`chat-read ${conversation.activeAudio === message.id ? 'chat-read--active' : ''}`} onClick={() => { abortRecognition(); if (conversation.activeAudio === message.id) conversation.stopAudio(); else void conversation.playMessage(message); }} aria-label={conversation.activeAudio === message.id ? c.stopAudio : c.read}>{conversation.activeAudio === message.id ? <Square size={13} fill="currentColor" /> : <Volume2 size={15} />}<span>{conversation.activeAudio === message.id ? conversation.audioState === 'loading' ? c.loadingAudio : c.stopAudio : c.read}</span></button> : null}</article>)}{conversation.generating ? <div className="chat-thinking" role="status"><span className="chat-thinking-dots" aria-hidden="true"><i /><i /><i /></span><span>{c.thinking}</span></div> : null}</div></div>}
        </div>
        <div className="chat-bottom">
          {conversation.notice ? <div className="chat-notice" role="alert"><Info size={18} aria-hidden="true" /><div><p>{conversation.notice}</p>{conversation.canRetry ? <button className="chat-retry" onClick={conversation.retry}><RotateCcw size={14} aria-hidden="true" />{c.retry}</button> : null}</div><button className="icon-button" onClick={conversation.dismiss} aria-label={c.dismiss}><X size={16} /></button></div> : null}
          {listening || requestingMic ? <div className="chat-listening-status" role="status"><AudioLines size={18} aria-hidden="true" /><strong>{requestingMic ? c.requestingMic : c.listening}</strong>{listening ? <span>{c.listeningHint}</span> : null}</div> : null}
          <form className={`chat-composer ${listening ? 'chat-composer--listening' : ''}`} onSubmit={submit}>
            <label className="sr-only" htmlFor="chat-message">{c.input}</label><textarea id="chat-message" ref={composerRef} rows={1} value={draft} onChange={event => setDraft(event.target.value)} placeholder={listening ? c.noTranscript : c.placeholder} maxLength={4000} disabled={conversation.generating} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !listening && !requestingMic) { event.preventDefault(); send(draft); } }} />
            <div className="chat-composer-actions">{listening || requestingMic ? <><button key="cancel-listening" type="button" className="chat-mic" onClick={() => endListening(true)} aria-label={c.cancel}><X size={19} /></button><button key="accept-transcript" disabled={requestingMic} type="button" className="chat-send" onClick={() => endListening()} aria-label={c.useTranscript}><Check size={21} /></button></> : <><button key="start-listening" type="button" className="chat-mic" disabled={conversation.generating} onClick={beginListening} aria-label={c.listen}><Mic size={21} /></button>{conversation.generating ? <button key="stop-generation" type="button" className="chat-send" onClick={conversation.stopGeneration} aria-label={c.stop}><Square size={17} fill="currentColor" /></button> : <button key="send-message" type="submit" className="chat-send" disabled={!draft.trim()} aria-label={c.send}><ArrowRight size={24} /></button>}</>}</div>
          </form><div className="chat-footnote"><span>{c.disclaimer}</span><button onClick={() => openPanel('details')}>{c.details}<Info size={12} aria-hidden="true" /></button></div>
        </div>
      </>}
      {panel ? <InformationPanel key={panel} panel={panel} onClose={() => setPanel(null)} onPanel={openPanel} onReset={reset} locale={locale} home={home} /> : null}
    </main>
  </div>;
}
