import { useLayoutEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Mic, Square, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { AssistantCopy } from "../brand";
import type { AssistantState } from "../types";

type ComposerProps = {
  copy: AssistantCopy;
  input: string;
  status: AssistantState;
  onInput: (value: string) => void;
  onSend: () => void;
  onListen: () => void;
  onStopListening: () => void;
  onCancelListening: () => void;
};

export function Composer({
  copy,
  input,
  status,
  onInput,
  onSend,
  onListen,
  onStopListening,
  onCancelListening,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();
  const listening = status === "listening";
  const processing = status === "thinking" || status === "speaking" || status === "appearing";
  const canSend = Boolean(input.trim()) && !processing;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(116, Math.max(24, textarea.scrollHeight))}px`;
  }, [input]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) onSend();
  };

  return (
    <div className="assistant-composer-wrap">
      <form className={`assistant-composer${listening ? " is-listening" : ""}`} onSubmit={submit}>
        {listening ? (
            <motion.div
              className="assistant-listening"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            >
              <button className="assistant-icon-control" type="button" onClick={onCancelListening} aria-label={copy.cancelListening}>
                <X aria-hidden="true" />
              </button>
              <div className="assistant-listening__status" aria-live="polite">
                <span>{copy.listening}</span>
                <span className="assistant-wave" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
                </span>
                {input ? <small>{input}</small> : null}
              </div>
              <button className="assistant-stop-control" type="button" onClick={onStopListening} aria-label={copy.stopListening}>
                <Square aria-hidden="true" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="assistant-composer__default"
              initial={reduceMotion ? false : { opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
            >
              <label className="assistant-sr-only" htmlFor="platefy-message">{copy.placeholder}</label>
              <textarea
                id="platefy-message"
                ref={textareaRef}
                rows={1}
                value={input}
                placeholder={copy.placeholder}
                onChange={(event) => onInput(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="assistant-composer__controls">
                <button
                  className="assistant-icon-control assistant-mic-control"
                  type="button"
                  onClick={onListen}
                  disabled={processing}
                  aria-label={copy.microphone}
                >
                  <Mic aria-hidden="true" />
                </button>
                <motion.button
                  className="assistant-send-control"
                  type="submit"
                  disabled={!canSend}
                  aria-label={copy.send}
                  animate={{ opacity: canSend ? 1 : 0.38, scale: canSend ? 1 : 0.92 }}
                  whileTap={reduceMotion || !canSend ? undefined : { scale: 0.92 }}
                >
                  <ArrowUp aria-hidden="true" />
                </motion.button>
              </div>
            </motion.div>
          )}
      </form>
    </div>
  );
}
