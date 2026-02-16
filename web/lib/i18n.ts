export const LANGUAGES = ["en", "de", "ru"] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = "en";

export function isValidLang(lang: string): lang is Lang {
  return (LANGUAGES as readonly string[]).includes(lang);
}
