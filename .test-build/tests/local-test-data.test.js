"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const local_test_data_1 = require("../app/lib/local-test-data");
function storageWithKeys(initialKeys) {
    const keys = [...initialKeys];
    const removed = [];
    return {
        storage: {
            get length() {
                return keys.length;
            },
            key(index) {
                var _a;
                return (_a = keys[index]) !== null && _a !== void 0 ? _a : null;
            },
            removeItem(key) {
                removed.push(key);
                const index = keys.indexOf(key);
                if (index >= 0)
                    keys.splice(index, 1);
            },
        },
        removed,
    };
}
(0, node_test_1.describe)("local test data keys", () => {
    (0, node_test_1.it)("recognizes exact app-local test/cache keys", () => {
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekind_profile_local"), true);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekindProfile"), true);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekindAccount"), true);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekindVoiceProfile"), true);
    });
    (0, node_test_1.it)("recognizes generated chat, unread, and liked match keys", () => {
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekindChat_anna"), true);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekindUnread_anna"), true);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("truekind_liked_matches:user-1"), true);
    });
    (0, node_test_1.it)("does not include demo tool visibility or Supabase auth storage", () => {
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)(local_test_data_1.DEMO_TOOLS_STORAGE_KEY), false);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("sb-project-auth-token"), false);
        strict_1.default.equal((0, local_test_data_1.isTrueKindLocalTestDataKey)("supabase.auth.token"), false);
    });
    (0, node_test_1.it)("selects only TrueKind local test/cache data from storage", () => {
        const { storage } = storageWithKeys([
            "truekind_profile_local",
            "truekind_liked_matches:user-1",
            local_test_data_1.DEMO_TOOLS_STORAGE_KEY,
            "sb-project-auth-token",
            "unrelated",
        ]);
        strict_1.default.deepEqual((0, local_test_data_1.getTrueKindLocalTestDataKeys)(storage), [
            "truekind_profile_local",
            "truekind_liked_matches:user-1",
        ]);
    });
    (0, node_test_1.it)("clears selected local test/cache keys without removing unrelated keys", () => {
        const { storage, removed } = storageWithKeys([
            "truekindProfile",
            "truekindChat_anna",
            "truekindUnread_anna",
            "truekind_liked_matches:local",
            local_test_data_1.DEMO_TOOLS_STORAGE_KEY,
            "sb-project-auth-token",
            "unrelated",
        ]);
        const cleared = (0, local_test_data_1.clearTrueKindLocalTestData)(storage);
        strict_1.default.deepEqual(cleared, [
            "truekindProfile",
            "truekindChat_anna",
            "truekindUnread_anna",
            "truekind_liked_matches:local",
        ]);
        strict_1.default.deepEqual(removed, cleared);
        strict_1.default.deepEqual((0, local_test_data_1.getTrueKindLocalTestDataKeys)(storage), []);
    });
});
