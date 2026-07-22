"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(key);
    if (!saved) {
      setReady(true);
      return;
    }

    try {
      setValue({ ...fallback, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(key);
    } finally {
      setReady(true);
    }
  }, [fallback, key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue];
}
