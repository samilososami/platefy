import type { CSSProperties } from "react";
import { motion } from "motion/react";
import type { AssistantState } from "../types";

type PlatefyOrbProps = {
  state: AssistantState;
  label: string;
  level?: number;
  size?: "welcome" | "chat" | "compact";
};

type OrbStyle = CSSProperties & { "--orb-level": string };

export function PlatefyOrb({ state, label, level = 0.08, size = "chat" }: PlatefyOrbProps) {
  const style: OrbStyle = { "--orb-level": Math.min(1, Math.max(0, level)).toFixed(3) };

  return (
    <motion.div
      className={`platefy-orb platefy-orb--${size}`}
      data-state={state}
      layoutId="platefy-living-orb"
      layout
      role="img"
      aria-label={`${label}. Platefy AI orb.`}
      style={style}
      transition={{ layout: { type: "spring", stiffness: 118, damping: 20, mass: 0.8 } }}
    >
      <span className="platefy-orb__ring platefy-orb__ring--outer" aria-hidden="true" />
      <span className="platefy-orb__ring platefy-orb__ring--inner" aria-hidden="true" />
      <span className="platefy-orb__shadow" aria-hidden="true" />
      <span className="platefy-orb__shell" aria-hidden="true">
        <span className="platefy-orb__flow platefy-orb__flow--one" />
        <span className="platefy-orb__flow platefy-orb__flow--two" />
        <span className="platefy-orb__flow platefy-orb__flow--three" />
        <span className="platefy-orb__glass" />
        <span className="platefy-orb__spark" />
      </span>
    </motion.div>
  );
}
