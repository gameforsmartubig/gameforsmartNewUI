// i18n configuration and utilities
export type Language = 'en' | 'id';

export interface Translations {
  [key: string]: string | Translations;
}

export const supportedLanguages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: 'us' },
  { code: 'id', name: 'Bahasa Indonesia', flag: 'id' },
];

export const defaultLanguage: Language = 'en';

// Translation storage
const translations: Record<Language, Translations> = {
  en: {},
  id: {},
};

// Current language state
let currentLanguage: Language = defaultLanguage;

// Load translations dynamically
export const loadTranslations = async (language: Language): Promise<void> => {
  try {
    const translationModule = await import(`../locales/${language}.json`);
    translations[language] = translationModule.default;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}:`, error);
    // Fallback to default language if current language fails
    if (language !== defaultLanguage) {
      try {
        const fallbackModule = await import(`../locales/${defaultLanguage}.json`);
        translations[language] = fallbackModule.default;
      } catch (fallbackError) {
        console.error('Failed to load fallback translations:', fallbackError);
      }
    }
  }
};

// Set current language
export const setLanguage = async (language: Language): Promise<void> => {
  currentLanguage = language;
  await loadTranslations(language);
};

// Get current language
export const getCurrentLanguage = (): Language => currentLanguage;

// Translation function with nested key support
export const t = (key: string, params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  // Navigate through nested keys
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default language
      let fallbackValue: any = translations[defaultLanguage];
      for (const fallbackKey of keys) {
        if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
          fallbackValue = fallbackValue[fallbackKey];
        } else {
          // Return key if translation not found
          return key;
        }
      }
      value = fallbackValue;
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters if provided
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
};

// Initialize i18n with language from localStorage or default
export const initializeI18n = async (userLanguage?: Language): Promise<void> => {
  let languageToUse = userLanguage || defaultLanguage;
  
  // Try to get language from localStorage if no user language provided
  if (!userLanguage && typeof window !== 'undefined') {
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && supportedLanguages.some(lang => lang.code === storedLanguage)) {
      languageToUse = storedLanguage;
    }
  }
  
  await setLanguage(languageToUse);
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', languageToUse);
  }
};
