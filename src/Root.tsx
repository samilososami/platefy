import { lazy, Suspense } from "react";
import App from "./App";

const PlatefyAssistant = lazy(() => import("./assistant/PlatefyAssistant"));

export function Root() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const assistantRoute = normalizedPath === "/app" || normalizedPath.startsWith("/app/");

  return assistantRoute ? (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#f3e8dd" }} />}>
      <PlatefyAssistant />
    </Suspense>
  ) : <App />;
}
