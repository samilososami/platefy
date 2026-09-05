import { motion, useReducedMotion } from "motion/react";
import type { AssistantCopy, PlatefyBrand } from "../brand";
import type { AssistantState } from "../types";
import { PlatefyOrb } from "./PlatefyOrb";

type WelcomeExperienceProps = {
  brand: PlatefyBrand;
  copy: AssistantCopy;
  status: AssistantState;
  audioLevel: number;
  onEnter: () => void;
};

export function WelcomeExperience({ brand, copy, status, audioLevel, onEnter }: WelcomeExperienceProps) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.78;

  return (
    <motion.section
      className="assistant-welcome"
      aria-labelledby="assistant-welcome-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: reduceMotion ? "none" : "blur(12px)" }}
      transition={{ duration: reduceMotion ? 0 : 0.42 }}
    >
      <motion.div
        className="assistant-welcome__aura"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.7, filter: "blur(42px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(22px)" }}
        transition={{ duration: reduceMotion ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="assistant-welcome__center">
        <PlatefyOrb state={status} label={copy.stateLabels[status]} level={audioLevel} size="welcome" />
        <motion.h1
          id="assistant-welcome-title"
          className="assistant-wordmark assistant-welcome__title"
          initial={reduceMotion ? false : { opacity: 0, y: 22, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration, delay: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {brand.name}
        </motion.h1>
        <motion.p
          className="assistant-welcome__message"
          initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(9px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0 : 0.64, delay: reduceMotion ? 0 : 1.03 }}
        >
          {copy.welcome}
        </motion.p>
      </div>

      <motion.button
        className="assistant-primary-action"
        type="button"
        onClick={onEnter}
        disabled={status === "success"}
        initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: reduceMotion ? 0 : 0.56, delay: reduceMotion ? 0 : 1.28 }}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      >
        <span>{copy.start}</span>
        <span className="assistant-primary-action__glint" aria-hidden="true" />
      </motion.button>
    </motion.section>
  );
}
