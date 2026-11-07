export const THEME_STORAGE_KEY = "vestpayouts-theme";

export const THEME_INIT_SCRIPT =
  '(function(){try{var t=localStorage.getItem("' +
  THEME_STORAGE_KEY +
  '");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();';

export type ThemeName = "light" | "dark";

export function readStoredTheme(): ThemeName | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    /* private mode */
  }
  return null;
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0e1012" : "#ffffff");
}
