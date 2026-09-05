import { useEffect, useState, useTransition } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { content, localeOrder, type Locale, type SiteCopy } from "../content";

type NavbarProps = {
  copy: SiteCopy;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
};

export function Navbar({ copy, locale, onLocaleChange }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const setLocale = (next: Locale) => {
    startTransition(() => onLocaleChange(next));
  };

  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <nav className="glass site-nav" aria-label="Primary">
        <a className="wordmark" href="#top" aria-label="Platefy home" onClick={close}>
          platefy
        </a>

        <div className="desktop-nav-links">
          <a href="#producto">{copy.nav.product}</a>
          <a href="#como-funciona">{copy.nav.how}</a>
          <a href="#beneficios">{copy.nav.benefits}</a>
          <a href="#faq">{copy.nav.faq}</a>
        </div>

        <div className="nav-actions">
          <label className="locale-control">
            <span className="sr-only">{copy.nav.chooseLanguage}</span>
            <select
              aria-label={copy.nav.chooseLanguage}
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {localeOrder.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()} · {content[code].localeName}
                </option>
              ))}
            </select>
          </label>
          <a className="button button--dark nav-demo" href="/app">
            {copy.nav.demo}
          </a>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={open ? copy.nav.closeMenu : copy.nav.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="glass mobile-drawer"
            initial={reduceMotion ? false : { opacity: 0, y: -16, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(10px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
          >
            <a href="#producto" onClick={close}>{copy.nav.product}</a>
            <a href="#como-funciona" onClick={close}>{copy.nav.how}</a>
            <a href="#beneficios" onClick={close}>{copy.nav.benefits}</a>
            <a href="#faq" onClick={close}>{copy.nav.faq}</a>
            <a className="button button--dark" href="/app" onClick={close}>
              {copy.nav.demo}
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
