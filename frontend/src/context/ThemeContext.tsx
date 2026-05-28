import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // 1. Initialize state from localStorage > default ('system')
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hampi-theme") as Theme;
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    }
    return "system";
  });

  // 2. Hydrate from user DB preferences on login
  useEffect(() => {
    if (user && (user as any).theme) {
      const userTheme = (user as any).theme as Theme;
      if (userTheme === "light" || userTheme === "dark" || userTheme === "system") {
         setThemeState(userTheme);
      }
    }
  }, [user?.id]); 

  // 3. Keep track of OS preference
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  // 4. Listen for OS theme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // 5. Determine the actual resolved theme
  const resolvedTheme = useMemo(() => {
    if (theme === "system") return systemPreference;
    return theme;
  }, [theme, systemPreference]);

  // 6. Apply to DOM globally and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    
    localStorage.setItem("hampi-theme", theme);
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
