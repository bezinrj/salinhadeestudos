import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useState that persists in localStorage scoped to the current logged user.
 * When the user logs out, the value resets to defaultValue and the stored key is cleared.
 */
export function usePersistedState<T>(key: string, defaultValue: T) {
  const { user } = useAuth();
  const storageKey = user?.id ? `lov:${user.id}:${key}` : null;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    if (!storageKey) return defaultValue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw == null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  // Re-hydrate when the user changes (login after mount)
  useEffect(() => {
    if (!storageKey) {
      setValue(defaultValue);
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist on change
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* noop */
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}
