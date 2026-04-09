import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getLanguage, saveLanguage as saveLanguageToStorage } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  isLoading: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLang = async () => {
      const stored = await getLanguage();
      setLangState(stored);
      setIsLoading(false);
    };
    loadLang();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    await saveLanguageToStorage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
