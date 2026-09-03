import { useCallback, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { ...initialValue, ...parsed };
        }
        return parsed ?? initialValue;
      }
    } catch {
      return initialValue;
    }
    return initialValue;
  });

  const setValue = useCallback(
    (value) => {
      setStored((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage unavailable
        }
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}
