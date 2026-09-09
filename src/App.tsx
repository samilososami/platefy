import { lazy, Suspense, useEffect, useState } from 'react';
import type { Locale } from './content';
import { Orb } from './ui';
import { getRestaurantSlug, restaurantName } from './services/restaurant';

const Chatbot = lazy(() => import('./Chatbot'));
export default function App() {
  const embedded = /^\/demo\/chat\/?$/.test(location.pathname);
  const [locale, setLocale] = useState<Locale>(() => {
    const queryLocale = new URLSearchParams(location.search).get('lang');
    if (embedded && (queryLocale === 'es' || queryLocale === 'en' || queryLocale === 'ca')) return queryLocale;
    try { const value = localStorage.getItem('platefy-language'); return value === 'en' || value === 'ca' ? value : 'es'; } catch { return 'es'; }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem('platefy-language', locale); } catch { /* private browsing */ }
  }, [locale]);
  useEffect(() => {
    document.title = `${restaurantName(getRestaurantSlug())} · platefy`;
  }, [locale]);
  return <Suspense fallback={<div className="page-loading"><Orb state="appearing" /><span>Platefy</span></div>}><Chatbot embedded={embedded} locale={locale} onLocaleChange={setLocale} /></Suspense>;
}
