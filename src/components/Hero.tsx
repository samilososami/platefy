import { useRef, type PointerEvent } from "react";
import { ArrowDown, ArrowUpRight, Check, Globe2, MessageCircle } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { SiteCopy } from "../content";
import heroDevice from "../assets/hero-device.webp";
import { AnimatedText } from "./AnimatedText";

type HeroProps = {
  copy: SiteCopy["hero"];
};

export function Hero({ copy }: HeroProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const deviceY = useTransform(scrollYProgress, [0, 0.2], [0, reduceMotion ? 0 : 72]);

  const moveSpotlight = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage || event.pointerType === "touch") return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    stage.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  };

  return (
    <section className="hero" id="producto" aria-labelledby="hero-title">
      <div className="hero-copy">
        <AnimatedText lines={copy.title} className="display hero-title" as="h1" />
        <motion.p
          className="hero-body"
          initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: reduceMotion ? 0 : 0.52, duration: reduceMotion ? 0 : 0.7 }}
        >
          {copy.body}
        </motion.p>
        <motion.div
          className="hero-actions"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.65, duration: reduceMotion ? 0 : 0.55 }}
        >
          <a className="button button--dark button--large" href="/app">
            <span>{copy.demo}</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
          <a className="button button--outline button--large" href="#contacto">
            <span>{copy.talk}</span>
            <MessageCircle aria-hidden="true" />
          </a>
        </motion.div>
        <p className="trust-line"><span><Check aria-hidden="true" /></span>{copy.trust}</p>
      </div>

      <div
        className="hero-stage"
        ref={stageRef}
        onPointerMove={moveSpotlight}
        aria-label={copy.stageLabel}
      >
        <div className="stage-noise" aria-hidden="true" />
        <motion.div
          className="glass glass--dark stage-card stage-card--left"
          initial={reduceMotion ? false : { opacity: 0, x: -28, filter: "blur(14px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ delay: reduceMotion ? 0 : 0.72, duration: reduceMotion ? 0 : 0.8 }}
        >
          <span className="stage-icon"><MessageCircle aria-hidden="true" /></span>
          <h2>{copy.instant}</h2>
          <p>{copy.instantQuestion}</p>
          <p className="stage-response">{copy.instantAnswer}</p>
          <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
        </motion.div>

        <motion.div
          className="glass glass--dark stage-card stage-card--right"
          initial={reduceMotion ? false : { opacity: 0, x: 28, filter: "blur(14px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ delay: reduceMotion ? 0 : 0.82, duration: reduceMotion ? 0 : 0.8 }}
        >
          <span className="stage-icon"><Globe2 aria-hidden="true" /></span>
          <h2>{copy.language}</h2>
          <p>{copy.languageQuestion}</p>
          <p className="stage-response">{copy.languageAnswer}</p>
          <span className="language-count">+ 8</span>
        </motion.div>

        <div className="hero-device-position">
          <motion.div
            className="hero-device-motion"
            style={{ y: deviceY }}
            initial={reduceMotion ? false : { opacity: 0, y: 70, filter: "blur(16px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: reduceMotion ? 0 : 0.36, duration: reduceMotion ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              className="hero-device"
              src={heroDevice}
              alt="Platefy restaurant assistant on a phone held in one hand"
              fetchPriority="high"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>

      <a className="hero-scroll" href="#como-funciona" aria-label={copy.scroll}>
        <span>{copy.scroll}</span>
        <ArrowDown aria-hidden="true" />
      </a>
    </section>
  );
}
