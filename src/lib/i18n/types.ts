export type Lang = "id" | "en" | "zh" | "ja" | "ko";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "id", label: "Indonesia", native: "Bahasa Indonesia" },
  { code: "en", label: "English", native: "English" },
  { code: "zh", label: "中文", native: "中文 (简体)" },
  { code: "ja", label: "日本語", native: "日本語" },
  { code: "ko", label: "한국어", native: "한국어" },
];

export const LANG_LABEL: Record<Lang, string> = {
  id: "Bahasa Indonesia",
  en: "English",
  zh: "中文 (简体)",
  ja: "日本語",
  ko: "한국어",
};

export type Translation = Record<Lang, string>;
export type DomainDict = Record<string, Translation>;
