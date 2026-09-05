import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { SiteCopy } from "../content";

type DemoModalProps = {
  copy: SiteCopy["demo"];
  onClose: () => void;
};

type Message = { role: "user" | "assistant"; text: string };

export default function DemoModal({ copy, onClose }: DemoModalProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [onClose]);

  const ask = (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || typing) return;
    setMessages((current) => [...current, { role: "user", text: cleanQuestion }]);
    setInput("");
    setTyping(true);
    timerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: copy.answer }]);
      setTyping(false);
    }, reduceMotion ? 120 : 720);
  };

  return (
    <motion.div
      className="demo-backdrop"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(18px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className="demo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
        tabIndex={-1}
        ref={dialogRef}
        initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98, filter: "blur(10px)" }}
      >
        <header>
          <div><span className="demo-label"><Sparkles aria-hidden="true" />{copy.label}</span><h2 id="demo-title" className="display">{copy.title}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={copy.close}><X aria-hidden="true" /></button>
        </header>
        <p className="demo-intro">{copy.intro}</p>

        <div className="demo-suggestions">
          {copy.suggestions.map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>
          ))}
        </div>

        <div className="demo-messages" aria-live="polite">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.p
                className={`demo-message demo-message--${message.role}`}
                key={`${message.role}-${index}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              >
                {message.text}
              </motion.p>
            ))}
          </AnimatePresence>
          {typing ? <p className="demo-typing"><span className="typing-dots"><i /><i /><i /></span>{copy.typing}</p> : null}
        </div>

        <form className="demo-input" onSubmit={(event) => { event.preventDefault(); ask(input); }}>
          <label className="sr-only" htmlFor="demo-question">{copy.input}</label>
          <input id="demo-question" value={input} onChange={(event) => setInput(event.target.value)} placeholder={copy.input} />
          <button type="submit" aria-label={copy.send} disabled={!input.trim() || typing}><ArrowUp aria-hidden="true" /></button>
        </form>
      </motion.div>
    </motion.div>
  );
}
