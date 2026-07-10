"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const THEME_STORAGE_KEY = "serviceflow:theme";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext(null);

function normalizeThemePreference(value) {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function normalizeResolvedTheme(value) {
  return value === "dark" ? "dark" : "light";
}

function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? "dark" : "light";
}

function resolveTheme(themePreference) {
  const normalizedPreference = normalizeThemePreference(themePreference);

  return normalizedPreference === "system"
    ? getSystemTheme()
    : normalizeResolvedTheme(normalizedPreference);
}

function getInitialThemePreference() {
  if (typeof document === "undefined") {
    return "system";
  }

  return normalizeThemePreference(document.documentElement.dataset.themePreference);
}

function getInitialResolvedTheme() {
  if (typeof document === "undefined") {
    return "light";
  }

  return normalizeResolvedTheme(document.documentElement.dataset.theme);
}

function applyTheme(themePreference) {
  const normalizedPreference = normalizeThemePreference(themePreference);
  const resolvedTheme = resolveTheme(normalizedPreference);
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = normalizedPreference;
  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

function persistTheme(themePreference) {
  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      normalizeThemePreference(themePreference)
    );
  } catch {
    // Theme still applies for the current document if storage is unavailable.
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState(getInitialResolvedTheme);

  const setTheme = useCallback((nextTheme) => {
    const normalizedTheme = normalizeThemePreference(nextTheme);

    setThemeState(normalizedTheme);
    persistTheme(normalizedTheme);
    setResolvedTheme(applyTheme(normalizedTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    setThemeState(nextTheme);
    persistTheme(nextTheme);
    setResolvedTheme(applyTheme(nextTheme));
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    applyTheme(theme);

    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia(SYSTEM_THEME_QUERY)
        : null;

    function handleSystemThemeChange() {
      setThemeState((currentTheme) => {
        if (currentTheme !== "system") {
          return currentTheme;
        }

        setResolvedTheme(applyTheme("system"));

        return currentTheme;
      });
    }

    function handleStorage(event) {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = normalizeThemePreference(event.newValue);

      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    }

    window.addEventListener("storage", handleStorage);
    mediaQuery?.addEventListener("change", handleSystemThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      mediaQuery?.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  const value = useMemo(
    () => ({
      isDark: resolvedTheme === "dark",
      resolvedTheme,
      setTheme,
      theme,
      toggleTheme
    }),
    [resolvedTheme, setTheme, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}

export { THEME_STORAGE_KEY, normalizeThemePreference };
