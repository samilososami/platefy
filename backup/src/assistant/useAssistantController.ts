import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "../content";
import type { PlatefyBrand } from "./brand";
import { createMockAnswer } from "./mockAssistant";
import type { AssistantState, AssistantSurface, ChatMessage, VoiceProvider } from "./types";
import { BrowserVoiceProvider } from "./voice/BrowserVoiceProvider";

const busyStates = new Set<AssistantState>(["appearing", "listening", "thinking", "speaking"]);
let messageSequence = 0;

const createMessage = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${messageSequence += 1}`,
  role,
  text,
});

function readInitialLocale(brand: PlatefyBrand): Locale {
  const savedLocale = window.localStorage.getItem(brand.localeStorageKey);
  return savedLocale === "es" || savedLocale === "en" || savedLocale === "ca"
    ? savedLocale
    : brand.defaultLocale;
}

export function useAssistantController(brand: PlatefyBrand, injectedVoiceProvider?: VoiceProvider) {
  const [surface, setSurface] = useState<AssistantSurface>("welcome");
  const [status, setStatus] = useState<AssistantState>("appearing");
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale(brand));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInputState] = useState("");
  const [audioLevel, setAudioLevel] = useState(0.08);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const voiceProvider = useMemo(
    () => injectedVoiceProvider ?? new BrowserVoiceProvider(),
    [injectedVoiceProvider],
  );
  const timersRef = useRef(new Set<number>());
  const mountedRef = useRef(true);
  const inputRef = useRef(input);
  const inputBeforeListeningRef = useRef("");
  const recognitionSupportedRef = useRef<boolean | null>(null);
  const listeningRequestRef = useRef(0);

  const copy = brand.copy[locale];
  const voiceLocale = brand.voiceLocales[locale];

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      if (mountedRef.current) callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    const timer = schedule(() => setStatus((current) => current === "appearing" ? "idle" : current), 1450);
    return () => {
      window.clearTimeout(timer);
      timers.delete(timer);
    };
  }, [schedule]);

  useEffect(() => {
    window.localStorage.setItem(brand.localeStorageKey, locale);
  }, [brand.localeStorageKey, locale]);

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      voiceProvider.dispose();
    };
  }, [voiceProvider]);

  const settle = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("success");
    setAudioLevel(0.08);
    schedule(() => setStatus("idle"), 520);
  }, [schedule]);

  const failGracefully = useCallback((message: string) => {
    if (!mountedRef.current) return;
    setNotice(message);
    setStatus("error");
    setAudioLevel(0.08);
    schedule(() => setStatus("idle"), 2400);
  }, [schedule]);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) {
      settle();
      return;
    }

    let failed = false;
    const didSpeak = await voiceProvider.speak(text, {
      lang: voiceLocale,
      onStart: () => {
        if (!mountedRef.current) return;
        setStatus("speaking");
        setAudioLevel(0.42);
      },
      onBoundary: () => {
        if (!mountedRef.current) return;
        setAudioLevel((current) => (current > 0.62 ? 0.32 : current + 0.16));
      },
      onEnd: settle,
      onError: () => {
        failed = true;
        settle();
      },
    });

    if (!didSpeak && !failed) settle();
  }, [settle, voiceEnabled, voiceLocale, voiceProvider]);

  const enterChat = useCallback(() => {
    if (surface !== "welcome") return;
    const localeCopy = brand.copy[locale];
    setMessages([createMessage("assistant", localeCopy.greeting)]);
    setStatus("success");
    void speak(localeCopy.spokenGreeting);
    schedule(() => {
      setSurface("chat");
    }, 340);
  }, [brand.copy, locale, schedule, speak, surface]);

  const sendMessage = useCallback((draft?: string) => {
    const question = (draft ?? inputRef.current).trim();
    if (!question || busyStates.has(status)) return;

    voiceProvider.stopSpeaking();
    setNotice(null);
    setInputState("");
    setMessages((current) => [...current, createMessage("user", question)]);
    setStatus("thinking");
    setAudioLevel(0.26);

    const answer = createMockAnswer(question, locale);
    schedule(() => {
      setMessages((current) => [...current, createMessage("assistant", answer)]);
      void speak(answer);
    }, 840);
  }, [locale, schedule, speak, status, voiceProvider]);

  const startListening = useCallback(async () => {
    if (busyStates.has(status)) return;

    const requestId = listeningRequestRef.current + 1;
    listeningRequestRef.current = requestId;
    inputBeforeListeningRef.current = inputRef.current;
    recognitionSupportedRef.current = null;
    setNotice(null);
    setStatus("listening");
    setAudioLevel(0.12);

    try {
      const result = await voiceProvider.startListening({
        lang: voiceLocale,
        onTranscript: (transcript) => {
          if (!mountedRef.current || !transcript) return;
          inputRef.current = transcript;
          setInputState(transcript);
        },
        onLevel: (level) => {
          if (mountedRef.current) setAudioLevel(level);
        },
        onEnd: () => {
          if (!mountedRef.current) return;
          voiceProvider.stopListening();
          setAudioLevel(0.08);
          setStatus("idle");
        },
        onError: () => {
          voiceProvider.cancelListening();
          failGracefully(brand.copy[locale].errorMicrophone);
        },
      });

      if (requestId !== listeningRequestRef.current) {
        voiceProvider.cancelListening();
        return;
      }
      recognitionSupportedRef.current = result.recognitionSupported;
    } catch {
      if (requestId !== listeningRequestRef.current) return;
      voiceProvider.cancelListening();
      failGracefully(brand.copy[locale].errorMicrophone);
    }
  }, [brand.copy, failGracefully, locale, status, voiceLocale, voiceProvider]);

  const stopListening = useCallback(() => {
    listeningRequestRef.current += 1;
    voiceProvider.stopListening();
    if (recognitionSupportedRef.current === false && !inputRef.current.trim()) {
      inputRef.current = brand.copy[locale].demoTranscript;
      setInputState(brand.copy[locale].demoTranscript);
      setNotice(brand.copy[locale].voiceDemo);
    }
    setAudioLevel(0.08);
    setStatus("idle");
  }, [brand.copy, locale, voiceProvider]);

  const cancelListening = useCallback(() => {
    listeningRequestRef.current += 1;
    voiceProvider.cancelListening();
    inputRef.current = inputBeforeListeningRef.current;
    setInputState(inputBeforeListeningRef.current);
    setAudioLevel(0.08);
    setStatus("idle");
  }, [voiceProvider]);

  const setInput = useCallback((nextInput: string) => {
    inputRef.current = nextInput;
    setInputState(nextInput);
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    listeningRequestRef.current += 1;
    voiceProvider.cancelListening();
    voiceProvider.stopSpeaking();
    setLocaleState(nextLocale);
    setStatus("idle");
    setNotice(null);
    setMessages((current) => {
      if (surface === "chat" && current.length <= 1) {
        return [createMessage("assistant", brand.copy[nextLocale].greeting)];
      }
      return current;
    });
  }, [brand.copy, surface, voiceProvider]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((current) => {
      if (current) {
        voiceProvider.stopSpeaking();
        if (status === "speaking") setStatus("idle");
      }
      return !current;
    });
  }, [status, voiceProvider]);

  return {
    audioLevel,
    cancelListening,
    copy,
    dismissNotice: () => setNotice(null),
    enterChat,
    input,
    locale,
    messages,
    notice,
    sendMessage,
    setInput,
    setLocale,
    startListening,
    status,
    stopListening,
    surface,
    toggleVoice,
    voiceEnabled,
  };
}
