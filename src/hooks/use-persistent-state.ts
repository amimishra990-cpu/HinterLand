"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

type StateUpdate<T> = T | ((current: T) => T);

type CachedValue = {
  raw: string;
  value: unknown;
};

const cache = new Map<string, CachedValue>();
const listeners = new Map<string, Set<() => void>>();

function storageKey(key: string) {
  return `hinterland:${key}`;
}

function subscribe(key: string, listener: () => void) {
  const keyListeners = listeners.get(key) ?? new Set<() => void>();
  keyListeners.add(listener);
  listeners.set(key, keyListeners);

  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(key) || event.key === null) {
      cache.delete(key);
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

function notify(key: string) {
  cache.delete(key);
  listeners.get(key)?.forEach((listener) => listener());
}

export function writePersistentData<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save local workspace data "${key}".`, error);
    throw new Error(
      "The browser could not save this workspace data. Check available local storage and try again.",
      { cause: error }
    );
  }
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  onError?: (error: Error) => void
) {
  const fallback = useRef(initialValue).current;
  const getSnapshot = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(key));
      if (raw === null) return fallback;
      const cached = cache.get(key);
      if (cached?.raw === raw) return cached.value as T;
      const value = JSON.parse(raw) as T;
      cache.set(key, { raw, value });
      return value;
    } catch (error) {
      console.error(`Could not read local workspace data "${key}".`, error);
      return fallback;
    }
  }, [fallback, key]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const subscribeToKey = useCallback(
    (listener: () => void) => subscribe(key, listener),
    [key]
  );
  const value = useSyncExternalStore(
    subscribeToKey,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    listeners.get(key)?.forEach((listener) => listener());
  }, [key]);

  const update = useCallback(
    (nextValue: StateUpdate<T>) => {
      const next =
        typeof nextValue === "function"
          ? (nextValue as (current: T) => T)(getSnapshot())
          : nextValue;
      try {
        writePersistentData(key, next);
        notify(key);
        return true;
      } catch (error) {
        onError?.(
          error instanceof Error ? error : new Error("Local workspace save failed.")
        );
        return false;
      }
    },
    [getSnapshot, key, onError]
  );

  return [value, update] as const;
}
