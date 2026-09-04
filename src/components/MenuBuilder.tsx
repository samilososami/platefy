import { useRef, useState } from "react";
import { ArrowRight, Check, Send } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { SiteCopy } from "../content";
import { AnimatedText } from "./AnimatedText";

type MenuBuilderProps = {
  copy: SiteCopy["menuBuilder"];
};

export function MenuBuilder({ copy }: MenuBuilderProps) {
  const [built, setBuilt] = useState(false);
  const [brief, setBrief] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!brief.trim()) {
      textareaRef.current?.focus();
      return;
    }
    setBuilt(true);
  };

  return (
    <section className="menu-builder section" id="contacto" aria-labelledby="menu-builder-title">
      <div className="menu-builder-copy">
        <AnimatedText lines={[copy.title]} className="display section-title" />
        <p className="section-body">{copy.body}</p>

        <form className={built ? "glass menu-form is-complete" : "glass menu-form"} onSubmit={submit}>
          <label htmlFor="menu-brief">{copy.label}</label>
          <textarea
            id="menu-brief"
            ref={textareaRef}
            value={brief}
            placeholder={copy.placeholder}
            onChange={(event) => {
              setBrief(event.target.value);
              if (built) setBuilt(false);
            }}
            rows={5}
          />
          <button className="button button--dark" type="submit">
            {built ? <Check aria-hidden="true" /> : null}
            <span>{built ? copy.submitted : copy.submit}</span>
            {built ? null : <ArrowRight aria-hidden="true" />}
          </button>
        </form>
        <p className="menu-note">{copy.note}</p>
      </div>

      <div className="phone-transform" aria-live="polite">
        <div className="transform-labels"><span>{copy.before}</span><span>{copy.after}</span></div>
        <motion.div
          className="mini-phone mini-phone--paper"
          initial={reduceMotion ? false : { opacity: 0, y: 25 }}
          whileInView={{ opacity: built ? 0.48 : 1, y: 0, rotate: built ? -2 : 0 }}
          viewport={{ once: false, amount: 0.45 }}
        >
          <span className="phone-island" aria-hidden="true" />
          <h3>{copy.paperTitle}</h3>
          <div className="paper-menu-list" aria-hidden="true">
            <p>Entrantes <span /></p><p>Ensalada verde <span /></p><p>Croquetas caseras <span /></p>
            <strong>Principales</strong>
            <p>Risotto de setas <span /></p><p>Salmón a la plancha <span /></p><p>Hamburguesa clásica <span /></p>
            <strong>Postres</strong>
            <p>Tarta de queso <span /></p><p>Brownie <span /></p>
          </div>
        </motion.div>

        <div className="transform-arrow" aria-hidden="true"><ArrowRight /></div>

        <motion.div
          className="mini-phone mini-phone--assistant"
          initial={reduceMotion ? false : { opacity: 0, y: 45, filter: "blur(14px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: built ? 1.035 : 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: reduceMotion ? 0 : 0.8 }}
        >
          <span className="phone-island" aria-hidden="true" />
          <span className="phone-wordmark">platefy</span>
          <h3>{copy.assistantTitle}</h3>
          <div className="phone-bubble">{copy.previewQuestion}</div>
          <div className="phone-bubble phone-bubble--answer">{copy.previewAnswer}</div>
          <div className="phone-dish-card">
            <div aria-hidden="true" />
            <span>Quinoa · avocado</span>
          </div>
          <div className="phone-input"><span>…</span><Send aria-hidden="true" /></div>
        </motion.div>
      </div>
    </section>
  );
}
