import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlatefyAssistant from "./PlatefyAssistant";
import type { VoiceProvider } from "./types";

const originalMediaDevices = navigator.mediaDevices;

describe("Platefy mobile assistant", () => {
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it("moves from the cinematic welcome into the chat", async () => {
    vi.useFakeTimers();
    render(<PlatefyAssistant />);

    expect(screen.getByRole("heading", { name: "Platefy" })).toBeInTheDocument();
    expect(screen.getByText("Hola. Soy Platefy. Estoy aquí para ayudarte.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    await act(async () => {
      vi.advanceTimersByTime(620);
      await Promise.resolve();
    });

    expect(screen.getByLabelText("Platefy chat")).toBeInTheDocument();
    expect(screen.getByText("Hola, ¿en qué puedo ayudarte?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Escribe un mensaje…")).toBeInTheDocument();
  });

  it("runs the mock conversation through thinking and response states", async () => {
    vi.useFakeTimers();
    render(<PlatefyAssistant />);

    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    await act(async () => {
      vi.advanceTimersByTime(1300);
      await Promise.resolve();
    });

    fireEvent.change(screen.getByPlaceholderText("Escribe un mensaje…"), {
      target: { value: "Busco algo vegetariano y ligero." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(screen.getByText("Busco algo vegetariano y ligero.")).toBeInTheDocument();
    expect(screen.getByText("Pensando", { selector: ".assistant-presence__status" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
    });

    expect(screen.getByText(/Te recomiendo el tartar de tomate con aguacate/)).toBeInTheDocument();
  });

  it("keeps a usable demo transcript when native speech recognition is unavailable", async () => {
    vi.useFakeTimers();
    const stop = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }),
      },
    });
    render(<PlatefyAssistant />);

    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    await act(async () => {
      vi.advanceTimersByTime(1300);
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hablar con Platefy" }));
      await Promise.resolve();
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText("Te escucho…")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Usar transcripción" }));

    expect(screen.getByDisplayValue("¿Qué plato vegetariano me recomiendas?")).toBeInTheDocument();
    expect(screen.getByText(/Tu navegador no ofrece transcripción/)).toBeInTheDocument();
    expect(stop).toHaveBeenCalled();
  });

  it("exposes the speaking state through an interchangeable voice provider", async () => {
    vi.useFakeTimers();
    let finishSpeech: (() => void) | undefined;
    const voiceProvider: VoiceProvider = {
      startListening: vi.fn(async () => ({ recognitionSupported: false })),
      stopListening: vi.fn(),
      cancelListening: vi.fn(),
      speak: vi.fn((_text, options) => {
        options.onStart();
        return new Promise<boolean>((resolve) => {
          finishSpeech = () => {
            options.onEnd();
            resolve(true);
          };
        });
      }),
      stopSpeaking: vi.fn(),
      dispose: vi.fn(),
    };

    render(<PlatefyAssistant voiceProvider={voiceProvider} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    await act(async () => {
      vi.advanceTimersByTime(380);
      await Promise.resolve();
    });

    expect(screen.getByText("Hablando", { selector: ".assistant-status p" })).toBeInTheDocument();

    await act(async () => {
      finishSpeech?.();
      vi.advanceTimersByTime(560);
      await Promise.resolve();
    });
    expect(screen.getByText("Disponible", { selector: ".assistant-status p" })).toBeInTheDocument();
  });
});
