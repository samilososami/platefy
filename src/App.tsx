import { lazy, Suspense, useEffect, useState } from 'react';
import type { Locale } from './content';
import { Orb } from './ui';
import { getRestaurantSlug } from './services/restaurant';

const Chatbot = lazy(() => import('./Chatbot'));
export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try { const value = localStorage.getItem('platefy-language'); return value === 'en' || value === 'ca' ? value : 'es'; } catch { return 'es'; }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('platefy-language', locale); } catch { /* private browsing */ }
  }, [locale]);
  useEffect(() => {
    document.title = `${getRestaurantSlug() === 'vita' ? 'Vita' : 'Kō'} · platefy`;
  }, [locale]);
  return <Suspense fallback={<div className="page-loading"><Orb state="appearing" /><span>Platefy</span></div>}><Chatbot locale={locale} onLocaleChange={setLocale} /></Suspense>;
}
