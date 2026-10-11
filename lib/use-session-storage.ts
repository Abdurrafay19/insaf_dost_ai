"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const CHANGE_EVENT = "insafdost:session-storage";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function useSessionStorageState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback((): string | null => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const getServerSnapshot = useCallback((): string | null => {
    return null;
  }, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const state = useMemo<T>(() => {
    if (raw === null) {
      return initialValue;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : initialValue;
    } catch {
      return initialValue;
    }
  }, [raw, initialValue, isValid]);

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const nextValue =
          typeof value === "function"
            ? (value as (prev: T) => T)(state)
            : value;
        window.sessionStorage.setItem(key, JSON.stringify(nextValue));
        window.dispatchEvent(new Event(CHANGE_EVENT));
      } catch {
        // Storage unavailable (quota exceeded or blocked); fail silently.
      }
    },
    [key, state],
  );

  return [state, setState];
}
