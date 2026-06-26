import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Language = "sv" | "en" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_CYCLE: Language[] = ["sv", "en", "de"];

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "sv";
    return (localStorage.getItem("notera-lang") as Language) || "sv";
  });

  useEffect(() => {
    localStorage.setItem("notera-lang", language);
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => setLanguageState((l) => {
    const i = LANG_CYCLE.indexOf(l);
    return LANG_CYCLE[(i + 1) % LANG_CYCLE.length];
  });

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

