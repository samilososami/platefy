import type { VoiceProvider, VoiceSpeakOptions, VoiceStartOptions } from "../types";

type RecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type RecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
};

type RecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
};

export class BrowserVoiceProvider implements VoiceProvider {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meterFrame: number | null = null;
  private recognition: SpeechRecognitionLike | null = null;
  private manualRecognitionEnd = false;
  private cancelPendingSpeech: (() => void) | null = null;

  async startListening(options: VoiceStartOptions): Promise<{ recognitionSupported: boolean }> {
    this.cancelListening();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone capture is not supported by this browser.");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.startLevelMeter(options.onLevel);

    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!Recognition) return { recognitionSupported: false };

    const recognition = new Recognition();
    this.recognition = recognition;
    this.manualRecognitionEnd = false;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang;
    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcript += result[0]?.transcript ?? "";
        if (index >= event.resultIndex && result.isFinal) isFinal = true;
      }
      options.onTranscript(transcript.trim(), isFinal);
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      options.onError(new Error(event.error ?? "Speech recognition failed."));
    };
    recognition.onend = () => {
      this.recognition = null;
      if (!this.manualRecognitionEnd) options.onEnd();
    };
    recognition.start();

    return { recognitionSupported: true };
  }

  stopListening(): void {
    this.manualRecognitionEnd = true;
    try {
      this.recognition?.stop();
    } catch {
      // A recognition instance may already have ended between frames.
    }
    this.recognition = null;
    this.stopCapture();
  }

  cancelListening(): void {
    this.manualRecognitionEnd = true;
    try {
      this.recognition?.abort();
    } catch {
      // A recognition instance may already have ended between frames.
    }
    this.recognition = null;
    this.stopCapture();
  }

  async speak(text: string, options: VoiceSpeakOptions): Promise<boolean> {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return false;

    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang;
    utterance.rate = 0.96;
    utterance.pitch = 0.94;

    const voices = window.speechSynthesis.getVoices();
    const languageRoot = options.lang.split("-")[0];
    const matchingVoice = voices.find((voice) => voice.lang === options.lang)
      ?? voices.find((voice) => voice.lang.startsWith(languageRoot));
    if (matchingVoice) utterance.voice = matchingVoice;

    return new Promise<boolean>((resolve) => {
      let finished = false;
      const watchdog = window.setTimeout(() => {
        if (finished) return;
        finished = true;
        this.cancelPendingSpeech = null;
        window.speechSynthesis.cancel();
        options.onEnd();
        resolve(true);
      }, Math.min(12000, Math.max(4200, text.length * 78)));

      const complete = (result: boolean, callback?: () => void) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(watchdog);
        this.cancelPendingSpeech = null;
        callback?.();
        resolve(result);
      };

      this.cancelPendingSpeech = () => complete(false);
      utterance.onstart = options.onStart;
      utterance.onboundary = options.onBoundary;
      utterance.onend = () => complete(true, options.onEnd);
      utterance.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") {
          complete(false);
          return;
        }
        complete(false, () => options.onError(new Error(event.error)));
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    this.cancelPendingSpeech?.();
    this.cancelPendingSpeech = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  dispose(): void {
    this.cancelListening();
    this.stopSpeaking();
  }

  private startLevelMeter(onLevel: (level: number) => void): void {
    const voiceWindow = window as VoiceWindow;
    const AudioContextConstructor = window.AudioContext ?? voiceWindow.webkitAudioContext;
    if (!AudioContextConstructor || !this.stream) {
      onLevel(0.12);
      return;
    }

    this.audioContext = new AudioContextConstructor();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.78;
    const source = this.audioContext.createMediaStreamSource(this.stream);
    source.connect(this.analyser);
    const samples = new Uint8Array(this.analyser.frequencyBinCount);
    let lastEmission = 0;
    let lastLevel = 0;

    const measure = (timestamp = 0) => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(samples);
      let total = 0;
      for (const sample of samples) total += sample;
      const average = total / Math.max(samples.length, 1);
      const level = Math.min(1, Math.max(0.08, average / 72));
      if (timestamp - lastEmission >= 80 && Math.abs(level - lastLevel) >= 0.025) {
        lastEmission = timestamp;
        lastLevel = level;
        onLevel(level);
      }
      this.meterFrame = window.requestAnimationFrame(measure);
    };
    measure();
  }

  private stopCapture(): void {
    if (this.meterFrame !== null) window.cancelAnimationFrame(this.meterFrame);
    this.meterFrame = null;
    this.analyser?.disconnect();
    this.analyser = null;
    if (this.audioContext && this.audioContext.state !== "closed") void this.audioContext.close();
    this.audioContext = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
