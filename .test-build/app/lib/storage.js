"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_STORAGE_EVENT = exports.STORAGE_KEYS = void 0;
exports.getChatStorageKey = getChatStorageKey;
exports.getUnreadStorageKey = getUnreadStorageKey;
exports.safeRead = safeRead;
exports.safeWrite = safeWrite;
exports.safeWriteString = safeWriteString;
exports.safeReadString = safeReadString;
exports.removeStored = removeStored;
const profile_model_1 = require("./profile-model");
exports.STORAGE_KEYS = {
    profile: profile_model_1.PROFILE_STORAGE_KEY,
    legacyProfile: profile_model_1.LEGACY_PROFILE_STORAGE_KEY,
    lastMatch: "truekindLastMatch",
    selectedMatch: "truekindSelectedMatch",
    voice: "truekindVoiceProfile",
};
exports.APP_STORAGE_EVENT = "truekind-storage-updated";
function getChatStorageKey(name) {
    return `truekindChat_${name}`;
}
function getUnreadStorageKey(name) {
    return `truekindUnread_${name}`;
}
function safeRead(key, fallback) {
    if (typeof window === "undefined")
        return fallback;
    const raw = localStorage.getItem(key);
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return fallback;
    }
}
function safeWrite(key, value) {
    if (typeof window === "undefined")
        return;
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(exports.APP_STORAGE_EVENT, { detail: { key } }));
}
function safeWriteString(key, value) {
    if (typeof window === "undefined")
        return;
    localStorage.setItem(key, value);
    window.dispatchEvent(new CustomEvent(exports.APP_STORAGE_EVENT, { detail: { key } }));
}
function safeReadString(key) {
    if (typeof window === "undefined")
        return "";
    return localStorage.getItem(key) || "";
}
function removeStored(key) {
    if (typeof window === "undefined")
        return;
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(exports.APP_STORAGE_EVENT, { detail: { key } }));
}
