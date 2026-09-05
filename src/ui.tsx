import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Locale } from './content';

export type OrbState = 'idle' | 'appearing' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error';
export function assetUrl(path: string) {
  const base = location.pathname.replace(/\/chatbot(?:\/(?:index\.html)?)?$/, '/').replace(/\/index\.html$/, '/');
  return new URL(`${base.endsWith('/') ? base : `${base}/`}${path}`, location.origin).href;
}
export function Brand({ href = './' }: { href?: string }) {
  return <a className="brand" href={href} aria-label="Platefy"><span>platefy</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" /></svg></a>;
}
export function LanguageSelect({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return <label className="language-select"><span className="sr-only">{locale === 'en' ? 'Language' : locale === 'ca' ? 'Idioma' : 'Idioma'}</span><select value={locale} onChange={e => onChange(e.target.value as Locale)} aria-label="Idioma"><option value="es">ES</option><option value="en">EN</option><option value="ca">CA</option></select><ChevronDown size={15} aria-hidden="true" /></label>;
}
export function Orb({ state = 'idle', className = '' }: { state?: OrbState; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`orb orb--${state} ${paused ? 'orb--paused' : ''} ${className}`} aria-hidden="true">
    <span className="orb-halo" /><span className="orb-ring orb-ring-one" /><span className="orb-ring orb-ring-two" />
    <div className="orb-body"><img src={assetUrl('images/platefy-orb.webp')} alt="" width="1254" height="1254" draggable="false" /><span className="orb-shine" /></div>
    <span className="orb-shadow" />
  </div>;
}
