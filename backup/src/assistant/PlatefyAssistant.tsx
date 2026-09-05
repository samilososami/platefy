import { useEffect } from "react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { getBrandVariables, platefyBrand, type PlatefyBrand } from "./brand";
import { ChatScreen } from "./components/ChatScreen";
import { WelcomeExperience } from "./components/WelcomeExperience";
import type { VoiceProvider } from "./types";
import { useAssistantController } from "./useAssistantController";
import "./assistant.css";

type PlatefyAssistantProps = {
  brand?: PlatefyBrand;
  voiceProvider?: VoiceProvider;
};

export default function PlatefyAssistant({ brand = platefyBrand, voiceProvider }: PlatefyAssistantProps) {
  const assistant = useAssistantController(brand, voiceProvider);

  useEffect(() => {
    const previousTitle = document.title;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeColor?.content;

    document.body.classList.add("assistant-active");
    document.title = `${brand.name} — Asistente`;
    if (themeColor) themeColor.content = brand.tokens.background;

    return () => {
      document.body.classList.remove("assistant-active");
      document.title = previousTitle;
      if (themeColor && previousThemeColor) themeColor.content = previousThemeColor;
    };
  }, [brand.name, brand.tokens.background]);

  useEffect(() => {
    document.documentElement.lang = assistant.locale;
  }, [assistant.locale]);

  return (
    <div className="platefy-assistant" style={getBrandVariables(brand)}>
      <div className="assistant-shell">
        <div className="assistant-ambient" aria-hidden="true" />
        <LayoutGroup>
          <AnimatePresence initial={false} mode="sync">
            {assistant.surface === "welcome" ? (
              <WelcomeExperience
                key="welcome"
                brand={brand}
                copy={assistant.copy}
                status={assistant.status}
                audioLevel={assistant.audioLevel}
                onEnter={assistant.enterChat}
              />
            ) : (
              <ChatScreen
                key="chat"
                brand={brand}
                copy={assistant.copy}
                locale={assistant.locale}
                messages={assistant.messages}
                input={assistant.input}
                status={assistant.status}
                audioLevel={assistant.audioLevel}
                voiceEnabled={assistant.voiceEnabled}
                notice={assistant.notice}
                onInput={assistant.setInput}
                onSend={assistant.sendMessage}
                onListen={() => void assistant.startListening()}
                onStopListening={assistant.stopListening}
                onCancelListening={assistant.cancelListening}
                onLocaleChange={assistant.setLocale}
                onToggleVoice={assistant.toggleVoice}
                onDismissNotice={assistant.dismissNotice}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}
