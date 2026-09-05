import type { CSSProperties } from "react";
import type { Locale } from "../content";
import type { AssistantState } from "./types";

export type AssistantCopy = {
  welcome: string;
  start: string;
  greeting: string;
  spokenGreeting: string;
  placeholder: string;
  send: string;
  microphone: string;
  stopListening: string;
  cancelListening: string;
  muteVoice: string;
  enableVoice: string;
  dismissNotice: string;
  chooseLanguage: string;
  listening: string;
  voiceDemo: string;
  demoTranscript: string;
  errorMicrophone: string;
  suggestions: string[];
  stateLabels: Record<AssistantState, string>;
};

export type PlatefyBrand = {
  name: string;
  localeStorageKey: string;
  defaultLocale: Locale;
  voiceLocales: Record<Locale, string>;
  copy: Record<Locale, AssistantCopy>;
  tokens: {
    background: string;
    backgroundSoft: string;
    surface: string;
    ink: string;
    inkSoft: string;
    muted: string;
    bronze: string;
    bronzeLight: string;
    success: string;
    error: string;
    serif: string;
    sans: string;
  };
};

export const platefyBrand: PlatefyBrand = {
  name: "Platefy",
  localeStorageKey: "platefy:locale:v1",
  defaultLocale: "es",
  voiceLocales: {
    es: "es-ES",
    en: "en-GB",
    ca: "ca-ES",
  },
  tokens: {
    background: "#f3e8dd",
    backgroundSoft: "#fbf5ef",
    surface: "#fffaf5",
    ink: "#0b0b0a",
    inkSoft: "#22201d",
    muted: "#756e67",
    bronze: "#a97849",
    bronzeLight: "#dfbd92",
    success: "#72845d",
    error: "#a34f43",
    serif: '"Bodoni Moda", Georgia, serif',
    sans: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  copy: {
    es: {
      welcome: "Hola. Soy Platefy. Estoy aquí para ayudarte.",
      start: "Empezar",
      greeting: "Hola, ¿en qué puedo ayudarte?",
      spokenGreeting: "Hola. Soy Platefy. Pregúntame lo que quieras sobre la carta.",
      placeholder: "Escribe un mensaje…",
      send: "Enviar mensaje",
      microphone: "Hablar con Platefy",
      stopListening: "Usar transcripción",
      cancelListening: "Cancelar escucha",
      muteVoice: "Silenciar la voz de Platefy",
      enableVoice: "Activar la voz de Platefy",
      dismissNotice: "Cerrar aviso",
      chooseLanguage: "Elegir idioma",
      listening: "Te escucho…",
      voiceDemo: "Tu navegador no ofrece transcripción. He preparado una frase de prueba.",
      demoTranscript: "¿Qué plato vegetariano me recomiendas?",
      errorMicrophone: "No he podido acceder al micrófono. Puedes seguir escribiendo.",
      suggestions: ["¿Qué me recomiendas?", "Opciones sin gluten"],
      stateLabels: {
        appearing: "Iniciando",
        idle: "Disponible",
        listening: "Escuchando",
        thinking: "Pensando",
        speaking: "Hablando",
        success: "Listo",
        error: "Necesita atención",
      },
    },
    en: {
      welcome: "Hello. I’m Platefy. I’m here to help.",
      start: "Start",
      greeting: "Hello, how can I help?",
      spokenGreeting: "Hello. I’m Platefy. Ask me anything about the menu.",
      placeholder: "Write a message…",
      send: "Send message",
      microphone: "Talk to Platefy",
      stopListening: "Use transcript",
      cancelListening: "Cancel listening",
      muteVoice: "Mute Platefy’s voice",
      enableVoice: "Enable Platefy’s voice",
      dismissNotice: "Dismiss notice",
      chooseLanguage: "Choose language",
      listening: "I’m listening…",
      voiceDemo: "Voice transcription is unavailable here, so I prepared a sample phrase.",
      demoTranscript: "What vegetarian dish do you recommend?",
      errorMicrophone: "I couldn’t access the microphone. You can keep typing.",
      suggestions: ["What do you recommend?", "Gluten-free options"],
      stateLabels: {
        appearing: "Starting",
        idle: "Available",
        listening: "Listening",
        thinking: "Thinking",
        speaking: "Speaking",
        success: "Ready",
        error: "Needs attention",
      },
    },
    ca: {
      welcome: "Hola. Soc Platefy. Soc aquí per ajudar-te.",
      start: "Començar",
      greeting: "Hola, en què et puc ajudar?",
      spokenGreeting: "Hola. Soc Platefy. Pregunta’m el que vulguis sobre la carta.",
      placeholder: "Escriu un missatge…",
      send: "Enviar missatge",
      microphone: "Parlar amb Platefy",
      stopListening: "Utilitzar transcripció",
      cancelListening: "Cancel·lar escolta",
      muteVoice: "Silenciar la veu de Platefy",
      enableVoice: "Activar la veu de Platefy",
      dismissNotice: "Tancar avís",
      chooseLanguage: "Triar idioma",
      listening: "T’escolto…",
      voiceDemo: "El navegador no ofereix transcripció. He preparat una frase de prova.",
      demoTranscript: "Quin plat vegetarià em recomanes?",
      errorMicrophone: "No he pogut accedir al micròfon. Pots continuar escrivint.",
      suggestions: ["Què em recomanes?", "Opcions sense gluten"],
      stateLabels: {
        appearing: "Iniciant",
        idle: "Disponible",
        listening: "Escoltant",
        thinking: "Pensant",
        speaking: "Parlant",
        success: "Fet",
        error: "Requereix atenció",
      },
    },
  },
};

type BrandVariables = CSSProperties & Record<`--pf-${string}`, string>;

export function getBrandVariables(brand: PlatefyBrand): BrandVariables {
  return {
    "--pf-background": brand.tokens.background,
    "--pf-background-soft": brand.tokens.backgroundSoft,
    "--pf-surface": brand.tokens.surface,
    "--pf-ink": brand.tokens.ink,
    "--pf-ink-soft": brand.tokens.inkSoft,
    "--pf-muted": brand.tokens.muted,
    "--pf-bronze": brand.tokens.bronze,
    "--pf-bronze-light": brand.tokens.bronzeLight,
    "--pf-success": brand.tokens.success,
    "--pf-error": brand.tokens.error,
    "--pf-serif": brand.tokens.serif,
    "--pf-sans": brand.tokens.sans,
  };
}
