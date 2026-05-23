import { STORAGE_KEYS } from "./storage";

export const DEMO_TOOLS_STORAGE_KEY = "truekind_demo_tools";

export const TRUEKIND_LOCAL_TEST_DATA_KEYS = [
  STORAGE_KEYS.legacyProfile,
  STORAGE_KEYS.profile,
  STORAGE_KEYS.lastMatch,
  STORAGE_KEYS.selectedMatch,
  STORAGE_KEYS.voice,
  "truekindAccount",
  "truekindVoiceMessage",
] as const;

export const TRUEKIND_LOCAL_TEST_DATA_PREFIXES = [
  "truekindChat_",
  "truekindUnread_",
  "truekind_liked_matches:",
] as const;

type ReadableStorage = {
  length: number;
  key(index: number): string | null;
};

type WritableStorage = ReadableStorage & {
  removeItem(key: string): void;
};

const localTestDataKeySet = new Set<string>(TRUEKIND_LOCAL_TEST_DATA_KEYS);

export function isTrueKindLocalTestDataKey(key: string) {
  return (
    localTestDataKeySet.has(key) ||
    TRUEKIND_LOCAL_TEST_DATA_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

export function getTrueKindLocalTestDataKeys(storage: ReadableStorage) {
  const keys: string[] = [];

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && isTrueKindLocalTestDataKey(key)) {
      keys.push(key);
    }
  }

  return keys;
}

export function clearTrueKindLocalTestData(storage: WritableStorage) {
  const keys = getTrueKindLocalTestDataKeys(storage);
  keys.forEach((key) => storage.removeItem(key));
  return keys;
}
