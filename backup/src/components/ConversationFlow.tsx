import { useState } from "react";
import { Check, UserRound } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { SiteCopy } from "../content";
import { AnimatedText } from "./AnimatedText";

type ConversationFlowProps = {
  copy: SiteCopy["conversation"];
};

export function ConversationFlow({ copy }: ConversationFlowProps) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <section className="conversation section" id="como-funciona" aria-labelledby="conversation-title">
      <div className="conversation-copy">
        <AnimatedText lines={[copy.title]} className="display section-title" />
        <motion.p
          className="section-body"
          initial={reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.5 }}
        >
          {copy.body}
        </motion.p>

        <div className="step-rail" aria-label="Platefy conversation steps">
          {copy.steps.map((step, index) => (
            <button
              className={active === index ? "step is-active" : "step"}
              type="button"
              key={step}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              <span>{active > index ? <Check aria-hidden="true" /> : index + 1}</span>
              {step}
            </button>
          ))}
        </div>
      </div>

      <div className="conversation-canvas">
        <div className="conversation-blur" aria-hidden="true" />
        <motion.article
          className="glass message-card message-card--question"
          animate={{ opacity: active >= 0 ? 1 : 0.35, scale: active === 0 ? 1.025 : 1 }}
        >
          <header><span><UserRound aria-hidden="true" /></span><strong>{copy.client}</strong><time>09:41</time></header>
          <p>{copy.question}</p>
        </motion.article>

        <span className="message-path message-path--one" aria-hidden="true" />

        <motion.article
          className="glass message-card message-card--answer"
          animate={{ opacity: active >= 1 ? 1 : 0.72, scale: active === 1 ? 1.025 : 1 }}
        >
          <header><span className="mini-mark">p</span><strong>Platefy</strong><time>09:41</time></header>
          <p>{copy.answer}</p>
          <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
        </motion.article>

        <span className="message-path message-path--two" aria-hidden="true" />

        <AnimatePresence initial={false}>
          <motion.article
            className="glass message-card message-card--recommendation"
            animate={{ opacity: active >= 2 ? 1 : 0.72, scale: active === 2 ? 1.025 : 1 }}
          >
            <header><span className="mini-mark">p</span><strong>Platefy</strong><time>09:41</time></header>
            <p>{copy.recommendation}</p>
            <div className="dish-result">
              <div className="dish-thumbnail" aria-hidden="true" />
              <div>
                <strong>{copy.dish}</strong>
                <div className="diet-tags">{copy.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}
