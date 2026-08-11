import type { DomainDict, Lang, Translation } from "./types";
import { commonDict } from "./common";
import { dashboardDict } from "./dashboard";
import { settingsDict } from "./settings";
import { processDict } from "./process";
import { qualityDict } from "./quality";
import { setupDict } from "./setup";
import { engineeringDict } from "./engineering";
import { inputDict } from "./input";
import { imporDict } from "./impor";
import { privacyDict } from "./privacy";
import { bantuanDict } from "./bantuan";

export const DOMAINS: DomainDict = {
  ...commonDict,
  ...dashboardDict,
  ...settingsDict,
  ...processDict,
  ...qualityDict,
  ...setupDict,
  ...engineeringDict,
  ...inputDict,
  ...imporDict,
  ...privacyDict,
  ...bantuanDict,
};

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry: Translation | undefined = DOMAINS[key];
  let text = entry?.[lang] ?? entry?.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function mergeDomain(lang: Lang, keys: DomainDict): (key: string, vars?: Record<string, string | number>) => string {
  return (key, vars) => {
    const entry = keys[key] ?? DOMAINS[key];
    let text = entry?.[lang] ?? entry?.en ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
