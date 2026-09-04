import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Platefy landing page", () => {
  it("renders the Spanish product story by default", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Tu carta, ahora sabe conversar." })).toBeInTheDocument();
    expect(screen.getByText("Sin apps. Sin fricción. En tu propia web.")).toBeInTheDocument();
  });

  it("switches all primary copy to English", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Elegir idioma"), { target: { value: "en" } });

    expect(screen.getByRole("heading", { name: "Your menu, now ready to talk." })).toBeInTheDocument();
    expect(screen.getByText("Fewer doubts. More confidence. Better decisions.")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("switches the complete experience to Catalan", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Elegir idioma"), { target: { value: "ca" } });

    expect(screen.getByRole("heading", { name: "La teva carta, ara sap conversar." })).toBeInTheDocument();
    expect(screen.getByText("Menys dubtes. Més confiança. Millors decisions.")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("ca");
  });

  it("reveals a different FAQ answer", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "¿Cómo aprende Platefy mi carta?" }));

    expect(screen.getByText(/Conectamos tu carta, horarios, ubicación/)).toBeInTheDocument();
  });
});
