import { motion, useReducedMotion } from "motion/react";
import type { SiteCopy } from "../content";
import budget from "../assets/budget.webp";
import dish from "../assets/dish.webp";
import globe from "../assets/globe.webp";
import menu from "../assets/menu.webp";
import microphone from "../assets/microphone.webp";
import salad from "../assets/salad.webp";
import { AnimatedText } from "./AnimatedText";

const capabilityAssets = [menu, microphone, dish, globe, budget, salad] as const;
const capabilityClasses = ["menu", "voice", "dish", "globe", "budget", "salad"] as const;

type CapabilitiesProps = {
  copy: SiteCopy["capabilities"];
};

export function Capabilities({ copy }: CapabilitiesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="capabilities section section--dark" id="beneficios" aria-labelledby="capabilities-title">
      <div className="capabilities-heading">
        <AnimatedText lines={[copy.title]} className="display section-title section-title--light" />
      </div>

      <div className="capability-constellation">
        <svg className="constellation-line" viewBox="0 0 1200 420" aria-hidden="true" preserveAspectRatio="none">
          <path d="M45 277 C155 198 235 328 342 246 S544 217 633 133 S815 91 892 205 S1061 289 1160 205" />
          {[45, 240, 425, 633, 892, 1160].map((cx, index) => (
            <circle key={cx} cx={cx} cy={[277, 260, 240, 133, 205, 205][index]} r="4" />
          ))}
        </svg>

        {copy.items.map((label, index) => (
          <motion.article
            className={`capability capability--${capabilityClasses[index]}`}
            key={label}
            initial={reduceMotion ? false : { opacity: 0, y: 40, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: reduceMotion ? 0 : 0.68,
              delay: reduceMotion ? 0 : index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="capability-asset"
              animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, index % 2 ? 1.2 : -1.2, 0] }}
              transition={{ duration: 5 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={capabilityAssets[index]} alt="" loading="lazy" decoding="async" />
            </motion.div>
            <h3>{label}</h3>
          </motion.article>
        ))}
      </div>

      <motion.p
        className="capability-benefit"
        initial={reduceMotion ? false : { opacity: 0, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.8 }}
      >
        <span aria-hidden="true">✓</span>{copy.benefit}
      </motion.p>
    </section>
  );
}
