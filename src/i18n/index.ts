import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from './translations';
import { LanguageCode } from '../types';

const LANGUAGE_KEY = 'app_language';

export const initI18n = async () => {
  const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  const language: LanguageCode = (savedLang as LanguageCode) || 'uz';

  await i18n.use(initReactI18next).init({
    resources: {
      uz: { translation: TRANSLATIONS.uz },
      ru: { translation: TRANSLATIONS.ru },
      uz_cyrl: { translation: TRANSLATIONS.uz_cyrl },
    },
    lng: language,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false,
    },
  });

  return language;
};

export const setLanguage = async (langCode: LanguageCode) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
  await i18n.changeLanguage(langCode);
};

export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

export const availableLanguages = [
  { code: 'uz' as LanguageCode, name: 'O\'zbek (lotin)', flag: '🇺🇿' },
  { code: 'ru' as LanguageCode, name: 'Русский', flag: '🇷🇺' },
  { code: 'uz_cyrl' as LanguageCode, name: 'O\'zbek (kiril)', flag: '🇺🇿' },
];

export default i18n;
