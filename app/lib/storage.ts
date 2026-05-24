import { LEGACY_PROFILE_STORAGE_KEY, PROFILE_STORAGE_KEY } from "./profile-model";

export const STORAGE_KEYS = {
  profile: PROFILE_STORAGE_KEY,
  legacyProfile: LEGACY_PROFILE_STORAGE_KEY,
  voice: "truekindVoiceProfile",
};

export const APP_STORAGE_EVENT = "truekind-storage-updated";

export function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
