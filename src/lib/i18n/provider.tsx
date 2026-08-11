"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate } from "./index";
import { LANGS, type Lang } from "./types";

export type DateFormat = "yyyy-mm-dd" | "dd/mm/yyyy" | "mm/dd/yyyy";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dateFormat: DateFormat;
  setDateFormat: (f: DateFormat) => void;
  formatDate: (iso: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LANG_KEY = "eng_lang";
const DATE_KEY = "eng_date_format";

function initialLang(): Lang {
  if (typeof window === "undefined") return "id";
  const saved = window.localStorage.getItem(LANG_KEY);
  if (saved && LANGS.some((l) => l.code === saved)) return saved as Lang;
  return "id";
}

function initialDateFormat(): DateFormat {
  if (typeof window === "undefined") return "yyyy-mm-dd";
  const saved = window.localStorage.getItem(DATE_KEY) as DateFormat | null;
  if (saved && ["yyyy-mm-dd", "dd/mm/yyyy", "mm/dd/yyyy"].includes(saved)) return saved;
  return "yyyy-mm-dd";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [dateFormat, setDateFormatState] = useState<DateFormat>(initialDateFormat);

  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    window.localStorage.setItem(DATE_KEY, dateFormat);
  }, [dateFormat]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setDateFormat = useCallback((f: DateFormat) => setDateFormatState(f), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  const formatDate = useCallback(
    (iso: string) => {
      const [y, m, d] = iso.split("-");
      if (dateFormat === "dd/mm/yyyy") return `${d}/${m}/${y}`;
      if (dateFormat === "mm/dd/yyyy") return `${m}/${d}/${y}`;
      return iso;
    },
    [dateFormat]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, dateFormat, setDateFormat, formatDate }),
    [lang, setLang, t, dateFormat, setDateFormat, formatDate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n harus dipakai di dalam I18nProvider");
  return ctx;
}
