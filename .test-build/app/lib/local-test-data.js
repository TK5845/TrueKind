"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRUEKIND_LOCAL_TEST_DATA_PREFIXES = exports.TRUEKIND_LOCAL_TEST_DATA_KEYS = exports.DEMO_TOOLS_STORAGE_KEY = void 0;
exports.isTrueKindLocalTestDataKey = isTrueKindLocalTestDataKey;
exports.getTrueKindLocalTestDataKeys = getTrueKindLocalTestDataKeys;
exports.clearTrueKindLocalTestData = clearTrueKindLocalTestData;
const storage_1 = require("./storage");
exports.DEMO_TOOLS_STORAGE_KEY = "truekind_demo_tools";
exports.TRUEKIND_LOCAL_TEST_DATA_KEYS = [
    storage_1.STORAGE_KEYS.legacyProfile,
    storage_1.STORAGE_KEYS.profile,
    storage_1.STORAGE_KEYS.lastMatch,
    storage_1.STORAGE_KEYS.selectedMatch,
    storage_1.STORAGE_KEYS.voice,
    "truekindAccount",
    "truekindVoiceMessage",
];
exports.TRUEKIND_LOCAL_TEST_DATA_PREFIXES = [
    "truekindChat_",
    "truekindUnread_",
    "truekind_liked_matches:",
];
const localTestDataKeySet = new Set(exports.TRUEKIND_LOCAL_TEST_DATA_KEYS);
function isTrueKindLocalTestDataKey(key) {
    return (localTestDataKeySet.has(key) ||
        exports.TRUEKIND_LOCAL_TEST_DATA_PREFIXES.some((prefix) => key.startsWith(prefix)));
}
function getTrueKindLocalTestDataKeys(storage) {
    const keys = [];
    for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key && isTrueKindLocalTestDataKey(key)) {
            keys.push(key);
        }
    }
    return keys;
}
function clearTrueKindLocalTestData(storage) {
    const keys = getTrueKindLocalTestDataKeys(storage);
    keys.forEach((key) => storage.removeItem(key));
    return keys;
}
