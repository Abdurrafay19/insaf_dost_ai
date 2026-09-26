"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback((): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const getServerSnapshot = useCallback((): string | null => {
    return null;
  }, []);

  const raw = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  let state: T = initialValue;
  if (raw !== null) {
    try {
      state = JSON.parse(raw) as T;
    } catch {
      state = initialValue;
    }
  }

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const nextValue =
          typeof value === "function"
            ? (value as (prev: T) => T)(state)
            : value;
        window.localStorage.setItem(key, JSON.stringify(nextValue));
        window.dispatchEvent(new Event("storage"));
      } catch {
        // Storage unavailable (quota exceeded or private browsing); fail silently.
      }
    },
    [key, state],
  );

  return [state, setState];
}

