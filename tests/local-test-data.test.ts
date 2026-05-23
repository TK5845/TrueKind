import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEMO_TOOLS_STORAGE_KEY,
  clearTrueKindLocalTestData,
  getTrueKindLocalTestDataKeys,
  isTrueKindLocalTestDataKey,
} from "../app/lib/local-test-data";

function storageWithKeys(initialKeys: string[]) {
  const keys = [...initialKeys];
  const removed: string[] = [];

  return {
    storage: {
      get length() {
        return keys.length;
      },
      key(index: number) {
        return keys[index] ?? null;
      },
      removeItem(key: string) {
        removed.push(key);
        const index = keys.indexOf(key);
        if (index >= 0) keys.splice(index, 1);
      },
    },
    removed,
  };
}

describe("local test data keys", () => {
  it("recognizes exact app-local test/cache keys", () => {
    assert.equal(isTrueKindLocalTestDataKey("truekind_profile_local"), true);
    assert.equal(isTrueKindLocalTestDataKey("truekindProfile"), true);
    assert.equal(isTrueKindLocalTestDataKey("truekindAccount"), true);
    assert.equal(isTrueKindLocalTestDataKey("truekindVoiceProfile"), true);
    assert.equal(isTrueKindLocalTestDataKey("truekindLastMatch"), true);
    assert.equal(isTrueKindLocalTestDataKey("truekindSelectedMatch"), true);
  });

  it("recognizes generated chat, unread, and liked match keys", () => {
    assert.equal(isTrueKindLocalTestDataKey("truekindChat_anna"), true);
    assert.equal(isTrueKindLocalTestDataKey("truekindUnread_anna"), true);
    assert.equal(
      isTrueKindLocalTestDataKey("truekind_liked_matches:user-1"),
      true
    );
  });

  it("does not include demo tool visibility or Supabase auth storage", () => {
    assert.equal(isTrueKindLocalTestDataKey(DEMO_TOOLS_STORAGE_KEY), false);
    assert.equal(isTrueKindLocalTestDataKey("sb-project-auth-token"), false);
    assert.equal(isTrueKindLocalTestDataKey("supabase.auth.token"), false);
  });

  it("selects only TrueKind local test/cache data from storage", () => {
    const { storage } = storageWithKeys([
      "truekind_profile_local",
      "truekind_liked_matches:user-1",
      DEMO_TOOLS_STORAGE_KEY,
      "sb-project-auth-token",
      "unrelated",
    ]);

    assert.deepEqual(getTrueKindLocalTestDataKeys(storage), [
      "truekind_profile_local",
      "truekind_liked_matches:user-1",
    ]);
  });

  it("clears selected local test/cache keys without removing unrelated keys", () => {
    const { storage, removed } = storageWithKeys([
      "truekindProfile",
      "truekindChat_anna",
      "truekindUnread_anna",
      "truekind_liked_matches:local",
      DEMO_TOOLS_STORAGE_KEY,
      "sb-project-auth-token",
      "unrelated",
    ]);

    const cleared = clearTrueKindLocalTestData(storage);

    assert.deepEqual(cleared, [
      "truekindProfile",
      "truekindChat_anna",
      "truekindUnread_anna",
      "truekind_liked_matches:local",
    ]);
    assert.deepEqual(removed, cleared);
    assert.deepEqual(getTrueKindLocalTestDataKeys(storage), []);
  });
});
