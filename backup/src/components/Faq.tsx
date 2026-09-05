import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { SiteCopy } from "../content";
import { AnimatedText } from "./AnimatedText";

type FaqProps = {
  copy: SiteCopy["faq"];
};

export function Faq({ copy }: FaqProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <section className="faq-section section section--dark" id="faq" aria-labelledby="faq-title">
      <AnimatedText lines={[copy.title]} className="display section-title section-title--light" />
      <div className="faq-list">
        {copy.items.map((item, index) => {
          const open = openIndex === index;
          const panelId = `faq-panel-${index}`;
          return (
            <article className={open ? "faq-item is-open" : "faq-item"} key={item.question}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span>{item.question}</span>
                <span className="faq-icon">{open ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}</span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    id={panelId}
                    className="glass glass--dark faq-answer"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0 : 0.32 }}
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}
