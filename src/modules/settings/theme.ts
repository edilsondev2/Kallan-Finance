import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemePref = "auto" | "light" | "dark";

const KEY = "kf-theme";
const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

/** Mirrors what the inline script in the root route does before first paint. */
function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  const dark = pref === "dark" || (pref === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Theme preference stored on this device: automatic, light or dark. */
export function useTheme(): [ThemePref, (pref: ThemePref) => void] {
  const pref = useSyncExternalStore(subscribe, readPref, () => "auto" as ThemePref);

  // In automatic mode, follow the device when it switches between light and dark.
  useEffect(() => {
    if (pref !== "auto") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPref("auto");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const set = useCallback((next: ThemePref) => {
    try {
      if (next === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the choice still applies until reload */
    }
    applyPref(next);
    listeners.forEach((l) => l());
  }, []);

  return [pref, set];
}
