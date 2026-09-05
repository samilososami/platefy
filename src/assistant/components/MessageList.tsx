import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ChatMessage } from "../types";

type MessageListProps = {
  messages: ChatMessage[];
  thinking: boolean;
  thinkingLabel: string;
};

export function MessageList({ messages, thinking, thinkingLabel }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "end" });
  }, [messages, reduceMotion, thinking]);

  return (
    <div className="assistant-message-list" aria-live="polite" aria-busy={thinking}>
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.article
            className={`assistant-message assistant-message--${message.role}`}
            key={message.id}
            initial={reduceMotion ? false : { opacity: 0, y: 15, filter: "blur(9px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {message.role === "assistant" ? <span className="assistant-message__orb" aria-hidden="true" /> : null}
            <p>{message.text}</p>
          </motion.article>
        ))}

        {thinking ? (
          <motion.div
            className="assistant-thinking"
            key="assistant-thinking"
            initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4 }}
          >
            <span className="assistant-message__orb" aria-hidden="true" />
            <span className="assistant-thinking__dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="assistant-sr-only">{thinkingLabel}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
