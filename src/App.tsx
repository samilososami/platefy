import { lazy, Suspense, useEffect, useState } from 'react';
import type { Locale } from './content';
import Landing from './Landing';
import { Orb } from './ui';

const Chatbot = lazy(() => import('./Chatbot'));
export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try { const value = localStorage.getItem('platefy-language'); return value === 'en' || value === 'ca' ? value : 'es'; } catch { return 'es'; }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('platefy-language', locale); } catch { /* private browsing */ }
  }, [locale]);
  const chat = /(?:^|\/)chatbot(?:\/|$)/.test(location.pathname) || location.hash.startsWith('#/chatbot');
  useEffect(() => {
    document.title = chat
      ? ({ es: 'La mesa de Platefy — Tu asistente', en: 'The Platefy table — Your assistant', ca: 'La taula de Platefy — El teu assistent' }[locale])
      : ({ es: 'Platefy — Tu carta, ahora sabe conversar.', en: 'Platefy — Your menu has a voice.', ca: 'Platefy — La teva carta, ara sap conversar.' }[locale]);
  }, [chat, locale]);
  return chat ? <Suspense fallback={<div className="page-loading"><Orb state="appearing" /><span>Platefy</span></div>}><Chatbot locale={locale} onLocaleChange={setLocale} /></Suspense> : <Landing locale={locale} onLocaleChange={setLocale} />;
}
