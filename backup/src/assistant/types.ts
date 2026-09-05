export type AssistantState =
  | "appearing"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "success"
  | "error";

export type AssistantSurface = "welcome" | "chat";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type VoiceStartOptions = {
  lang: string;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onLevel: (level: number) => void;
  onEnd: () => void;
  onError: (error: Error) => void;
};

export type VoiceSpeakOptions = {
  lang: string;
  onStart: () => void;
  onBoundary: () => void;
  onEnd: () => void;
  onError: (error: Error) => void;
};

export type VoiceProvider = {
  startListening: (options: VoiceStartOptions) => Promise<{ recognitionSupported: boolean }>;
  stopListening: () => void;
  cancelListening: () => void;
  speak: (text: string, options: VoiceSpeakOptions) => Promise<boolean>;
  stopSpeaking: () => void;
  dispose: () => void;
};
