import { useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "savings-tracker.theme";

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") delete root.dataset.theme;
  else root.dataset.theme = preference;

  try {
    if (preference === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage can be blocked. The theme still applies for this visit.
  }
}

export interface ThemeColors {
  income: string;
  spending: string;
  text: string;
  muted: string;
  border: string;
  surface: string;
}

function readColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    income: token("--income"),
    spending: token("--spending"),
    text: token("--text"),
    muted: token("--text-muted"),
    border: token("--border"),
    surface: token("--bg"),
  };
}

/** Resolved token values for Recharts, which needs real colours in SVG attributes. */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState(readColors);

  useEffect(() => {
    const update = () => setColors(readColors());
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return colors;
}
