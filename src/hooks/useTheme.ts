import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "flowsolution-theme";

function apply(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "system") {
    const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.classList.add(sys);
  } else {
    root.classList.add(theme);
  }
}

function resolved(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (typeof window !== "undefined" ? ((localStorage.getItem(STORAGE_KEY) as Theme) || "system") : "system")
  );
  const [effective, setEffective] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" ? resolved() : "light"
  );

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    apply(t);
    setThemeState(t);
    setEffective(resolved());
  }, []);

  const toggle = useCallback(() => {
    setTheme(effective === "dark" ? "light" : "dark");
  }, [effective, setTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      apply("system");
      setEffective(resolved());
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, effective, setTheme, toggle };
}
