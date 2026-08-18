import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

//From here on out we should look at the user preferences and apply them to the DOM, and also provide a way to update the preferences and save them to the service.
export interface UserPreferences {
  visionMode: string;
  contrast: number;
  fontSize: number;
  lineHeight: number;
  readableFont: boolean;
  highlightLinks: boolean;
}

const DEFAULTS: UserPreferences = {
  visionMode: "none",
  contrast: 100,
  fontSize: 100,
  lineHeight: 100,
  readableFont: false,
  highlightLinks: false,
};

interface PreferencesContextType {
  prefs: UserPreferences;
  isLoading: boolean;
  isSaving: boolean;
  updatePrefs: (patch: Partial<UserPreferences>) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

async function apiFetch(path: string, options?: RequestInit) {
  return fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

const VISION_FILTERS: Record<string, string> = {
  none: "",
  protanopia: "url(#a11ai-filter-protanopia)",
  deuteranopia: "url(#a11ai-filter-deuteranopia)",
  tritanopia: "url(#a11ai-filter-tritanopia)",
  achromatopsia: "grayscale(100%)",
  lowvision: "contrast(150%) brightness(1.05)",
};

function applyPrefsToDOM(prefs: UserPreferences) {
  const root = document.documentElement;
  const body = document.body;

  // Vision mode + contrast as combined CSS filter on <html>
  const vf = VISION_FILTERS[prefs.visionMode] ?? "";
  const cf = prefs.contrast !== 100 ? `contrast(${prefs.contrast}%)` : "";
  root.style.filter = [vf, cf].filter(Boolean).join(" ");

  // Font size — scales the whole rem-based layout
  root.style.fontSize = prefs.fontSize !== 100 ? `${prefs.fontSize}%` : "";

  // Line height
  body.style.lineHeight =
    prefs.lineHeight !== 100 ? `${prefs.lineHeight / 100}` : "";

  // Readable font
  body.style.fontFamily = prefs.readableFont
    ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    : "";

  // Highlight links — inject/remove a <style> tag
  const STYLE_ID = "a11ai-pref-highlight-links";
  let styleEl = document.getElementById(STYLE_ID);
  if (prefs.highlightLinks) {
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent =
      "a { text-decoration: underline !important; text-decoration-thickness: 2px !important; }";
  } else {
    styleEl?.remove();
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Apply visual changes whenever prefs change
  useEffect(() => {
    applyPrefsToDOM(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULTS);
      return;
    }
    setIsLoading(true);
    apiFetch("/preferences")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { preferences: UserPreferences };
          setPrefs(data.preferences);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const updatePrefs = useCallback(
    async (patch: Partial<UserPreferences>) => {
      if (!user) return;
      const next = { ...prefs, ...patch };
      setPrefs(next);
      setIsSaving(true);
      try {
        const res = await apiFetch("/preferences", {
          method: "PUT",
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const data = (await res.json()) as { preferences: UserPreferences };
          setPrefs(data.preferences);
        }
      } catch {
        setPrefs(prefs);
      } finally {
        setIsSaving(false);
      }
    },
    [user, prefs]
  );

  return (
    <PreferencesContext.Provider value={{ prefs, isLoading, isSaving, updatePrefs }}>
      {/* SVG color-matrix filter definitions for colour-blindness simulation */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id="a11ai-filter-protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0 0 0
                      0.558 0.442 0 0 0
                      0     0.242 0.758 0 0
                      0     0     0     1 0"
            />
          </filter>
          <filter id="a11ai-filter-deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0   0 0
                      0.7   0.3   0   0 0
                      0     0.3   0.7 0 0
                      0     0     0   1 0"
            />
          </filter>
          <filter id="a11ai-filter-tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95  0.05  0     0 0
                      0     0.433 0.567 0 0
                      0     0.475 0.525 0 0
                      0     0     0     1 0"
            />
          </filter>
        </defs>
      </svg>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
