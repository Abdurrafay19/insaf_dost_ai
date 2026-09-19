"use client";

import { useEffect, useState } from "react";

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage unavailable (private browsing, quota exceeded); fail silently.
    }
  }, [key, state]);

  return [state, setState];
}
