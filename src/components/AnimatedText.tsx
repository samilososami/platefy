import { motion, useReducedMotion } from "motion/react";

type AnimatedTextProps = {
  lines: string[];
  className?: string;
  as?: "h1" | "h2";
};

export function AnimatedText({ lines, className, as = "h2" }: AnimatedTextProps) {
  const reduceMotion = useReducedMotion();
  const Tag = as === "h1" ? motion.h1 : motion.h2;

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.55 }}
      aria-label={lines.join(" ")}
    >
      {lines.map((line, index) => (
        <span className="title-line-clip" key={line} aria-hidden="true">
          <motion.span
            className="title-line"
            variants={{
              hidden: reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: "70%", filter: "blur(16px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration: reduceMotion ? 0 : 0.82,
                  delay: reduceMotion ? 0 : index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
