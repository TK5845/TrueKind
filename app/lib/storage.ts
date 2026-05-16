import { LEGACY_PROFILE_STORAGE_KEY, PROFILE_STORAGE_KEY } from "./profile-model";

export type ProfileData = {
  id?: string;
  name: string;
  age?: string;
  city: string;
  lookingFor?: string;
  looking_for?: string;
  interests?: string[];
  bio: string;
  prompt?: string;
  personal_thought?: string;
  image?: string;
  image_url?: string;
  profile_image_url?: string;
  contactIntent?: string;
  contact_intent?: string;
  activityInterest?: string;
  activity_interest?: string;
  favoriteSong?: string;
  favorite_song?: string;
  favoriteFilm?: string;
  favoriteMovie?: string;
  favorite_film?: string;
  favorite_movie?: string;
  favoriteBook?: string;
  favorite_book?: string;
  videoPresentation?: string;
  video_url?: string;
  voiceUrl?: string;
  voice_url?: string;
  voice_profile_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type MatchData = {
  match_id?: string;
  target_profile_id?: string;
  matchedName: string;
  matchedCity: string;
  matchedImage: string;
  name?: string;
  age?: number;
  city?: string;
  image?: string;
  chemistry_label?: string;
  about_text?: string;
  looking_for?: string;
  activity_label?: string;
  interests?: string[];
  latest_signal_text?: string;
  latest_signal_at?: string;
  unread_count?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ChatMessage = {
  id: number;
  sender: "other" | "me";
  text: string;
  createdAt: string;
};

export const STORAGE_KEYS = {
  profile: PROFILE_STORAGE_KEY,
  legacyProfile: LEGACY_PROFILE_STORAGE_KEY,
  lastMatch: "truekindLastMatch",
  selectedMatch: "truekindSelectedMatch",
  voice: "truekindVoiceProfile",
};

export const APP_STORAGE_EVENT = "truekind-storage-updated";

export function getChatStorageKey(name: string) {
  return `truekindChat_${name}`;
}

export function getUnreadStorageKey(name: string) {
  return `truekindUnread_${name}`;
}

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

export function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(APP_STORAGE_EVENT, { detail: { key } }));
}

export function safeWriteString(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent(APP_STORAGE_EVENT, { detail: { key } }));
}

export function safeReadString(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}

export function removeStored(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(APP_STORAGE_EVENT, { detail: { key } }));
}
