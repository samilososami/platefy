import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Capabilities } from "./components/Capabilities";
import { ConversationFlow } from "./components/ConversationFlow";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { MenuBuilder } from "./components/MenuBuilder";
import { Navbar } from "./components/Navbar";
import { content, type Locale } from "./content";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

const DemoModal = lazy(() => import("./components/DemoModal"));
const localeStorageKey = "platefy:locale:v1";

function getInitialLocale(): Locale {
  const saved = window.localStorage.getItem(localeStorageKey);
  return saved === "en" || saved === "ca" || saved === "es" ? saved : "es";
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [demoOpen, setDemoOpen] = useState(false);
  const copy = content[locale];
  useSmoothScroll();

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(localeStorageKey, locale);
    document.title = `Platefy — ${copy.hero.title.join(" ")}`;
  }, [copy.hero.title, locale]);

  const openDemo = useCallback(() => setDemoOpen(true), []);
  const closeDemo = useCallback(() => setDemoOpen(false), []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        {locale === "es" ? "Saltar al contenido" : locale === "ca" ? "Ves al contingut" : "Skip to content"}
      </a>
      <Navbar copy={copy} locale={locale} onLocaleChange={setLocale} onDemo={openDemo} />
      <main id="main-content">
        <div id="top" />
        <Hero copy={copy.hero} onDemo={openDemo} />
        <ConversationFlow copy={copy.conversation} />
        <Capabilities copy={copy.capabilities} />
        <MenuBuilder copy={copy.menuBuilder} />
        <Faq copy={copy.faq} />
      </main>
      <Footer copy={copy} locale={locale} onDemo={openDemo} />

      <AnimatePresence>
        {demoOpen ? (
          <Suspense fallback={null}>
            <DemoModal copy={copy.demo} onClose={closeDemo} />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </>
  );
}
