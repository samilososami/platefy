import { ArrowUpRight } from "lucide-react";
import type { Locale, SiteCopy } from "../content";

type FooterProps = {
  copy: SiteCopy;
  locale: Locale;
  onDemo: () => void;
};

export function Footer({ copy, locale, onDemo }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <h2 className="display">
          {copy.cta.titleStart} <em>{copy.cta.titleAccent}</em>
        </h2>
        <div>
          <button className="button button--dark button--large" type="button" onClick={onDemo}>
            {copy.cta.demo}<ArrowUpRight aria-hidden="true" />
          </button>
          <a href="#contacto" className="text-link">{copy.cta.talk}<ArrowUpRight aria-hidden="true" /></a>
        </div>
      </div>
      <div className="footer-meta">
        <div>
          <a className="wordmark" href="#top">platefy</a>
          <p>{copy.footer.note}</p>
        </div>
        <nav aria-label="Footer">
          <a href="#producto">{copy.footer.product}</a>
          <a href="#faq">{copy.nav.faq}</a>
          <a href="#contacto">{copy.footer.contact}</a>
          <span>{locale.toUpperCase()}</span>
        </nav>
      </div>
    </footer>
  );
}
