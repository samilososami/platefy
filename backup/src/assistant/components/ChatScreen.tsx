import { Sparkles, Volume2, VolumeX, WheatOff, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { localeOrder, type Locale } from "../../content";
import type { AssistantCopy, PlatefyBrand } from "../brand";
import type { AssistantState, ChatMessage } from "../types";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { PlatefyOrb } from "./PlatefyOrb";

type ChatScreenProps = {
  brand: PlatefyBrand;
  copy: AssistantCopy;
  locale: Locale;
  messages: ChatMessage[];
  input: string;
  status: AssistantState;
  audioLevel: number;
  voiceEnabled: boolean;
  notice: string | null;
  onInput: (value: string) => void;
  onSend: (draft?: string) => void;
  onListen: () => void;
  onStopListening: () => void;
  onCancelListening: () => void;
  onLocaleChange: (locale: Locale) => void;
  onToggleVoice: () => void;
  onDismissNotice: () => void;
};

export function ChatScreen({
  brand,
  copy,
  locale,
  messages,
  input,
  status,
  audioLevel,
  voiceEnabled,
  notice,
  onInput,
  onSend,
  onListen,
  onStopListening,
  onCancelListening,
  onLocaleChange,
  onToggleVoice,
  onDismissNotice,
}: ChatScreenProps) {
  const reduceMotion = useReducedMotion();
  const compact = messages.length > 1;
  const suggestionsVisible = messages.length === 1 && status === "idle";
  const statusLabel = copy.stateLabels[status];

  return (
    <motion.section
      className="assistant-chat"
      aria-label={`${brand.name} chat`}
      initial={reduceMotion ? false : { opacity: 0, filter: "blur(14px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
    >
      <header className="assistant-header">
        <div className="assistant-header__identity">
          <a className="assistant-wordmark assistant-header__wordmark" href="/" aria-label={`${brand.name} home`}>
            {brand.name}
          </a>
          <div className={`assistant-status assistant-status--${status}`} aria-live="polite">
            <span aria-hidden="true" />
            <p>{statusLabel}</p>
          </div>
        </div>

        <div className="assistant-header__controls">
          <label className="assistant-locale-control">
            <span className="assistant-sr-only">{copy.chooseLanguage}</span>
            <select
              value={locale}
              aria-label={copy.chooseLanguage}
              onChange={(event) => onLocaleChange(event.target.value as Locale)}
            >
              {localeOrder.map((code) => <option value={code} key={code}>{code.toUpperCase()}</option>)}
            </select>
          </label>
          <button
            className="assistant-header-control"
            type="button"
            onClick={onToggleVoice}
            aria-label={voiceEnabled ? copy.muteVoice : copy.enableVoice}
            aria-pressed={!voiceEnabled}
          >
            {voiceEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className="assistant-conversation">
        <div className="assistant-conversation__scroll">
          <motion.div
            className={`assistant-presence${compact ? " is-compact" : ""}`}
            layout
            transition={{ layout: { type: "spring", stiffness: 120, damping: 22 } }}
          >
            <PlatefyOrb
              state={status}
              label={statusLabel}
              level={audioLevel}
              size={compact ? "compact" : "chat"}
            />
            {status !== "idle" ? (
              <motion.p
                className="assistant-presence__status"
                key={status}
                initial={reduceMotion ? false : { opacity: 0, y: 6, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              >
                {statusLabel}
              </motion.p>
            ) : null}
          </motion.div>

          <MessageList messages={messages} thinking={status === "thinking"} thinkingLabel={statusLabel} />

          {suggestionsVisible ? (
            <motion.div
              className="assistant-suggestions"
              initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(7px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: reduceMotion ? 0 : 0.2 }}
            >
              {copy.suggestions.map((suggestion, index) => (
                <button type="button" onClick={() => onSend(suggestion)} key={suggestion}>
                  {index === 0 ? <Sparkles aria-hidden="true" /> : <WheatOff aria-hidden="true" />}
                  <span>{suggestion}</span>
                </button>
              ))}
            </motion.div>
          ) : null}

          {notice ? (
            <motion.div
              className={`assistant-notice${status === "error" ? " is-error" : ""}`}
              role={status === "error" ? "alert" : "status"}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>{notice}</p>
              <button type="button" onClick={onDismissNotice} aria-label={copy.dismissNotice}>
                <X aria-hidden="true" />
              </button>
            </motion.div>
          ) : null}
        </div>
      </main>

      <Composer
        copy={copy}
        input={input}
        status={status}
        onInput={onInput}
        onSend={() => onSend()}
        onListen={onListen}
        onStopListening={onStopListening}
        onCancelListening={onCancelListening}
      />
    </motion.section>
  );
}
