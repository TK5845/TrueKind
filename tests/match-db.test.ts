import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  loadStoredMatchSource,
  readStoredLikedMatchIds,
  readStoredLikedMatches,
  saveLikedMatch,
  updateLikedMatchStatus,
} from "../app/lib/match-db";
import type { CanonicalMatch } from "../app/lib/match-model";

const originalWindow = globalThis.window;

function baseMatch(overrides: Partial<CanonicalMatch> = {}): CanonicalMatch {
  return {
    match_id: "anna",
    target_profile_id: "anna-profile",
    name: "Anna",
    age: 34,
    city: "Malmö",
    image: "",
    chemistry_label: "Varm",
    about_text: "Test",
    looking_for: "Kontakt",
    activity_label: "Kaffe",
    interests: [],
    latest_signal_text: "",
    latest_signal_at: "",
    unread_count: 0,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function installWindowStorage() {
  const storage = new Map<string, string>();
  const events: string[] = [];

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem(key: string) {
          return storage.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          storage.set(key, value);
        },
        removeItem(key: string) {
          storage.delete(key);
        },
      },
      dispatchEvent(event: Event) {
        events.push(event.type);
        return true;
      },
    },
  });

  return { storage, events };
}

function failingMatchClient() {
  const result = { data: null, error: new Error("backend unavailable") };
  const query = {
    eq() {
      return query;
    },
    order() {
      return query;
    },
    then<TResult1 = typeof result, TResult2 = never>(
      onfulfilled?: ((value: typeof result) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return {
    from() {
      return {
        select() {
          return query;
        },
        update() {
          return query;
        },
        upsert() {
          return Promise.resolve({ error: new Error("upsert failed") });
        },
        insert() {
          return Promise.resolve({ error: new Error("insert failed") });
        },
      };
    },
  };
}

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("match-db local fallback", () => {
  it("stores likes locally as active when backend save fails", async () => {
    const { events } = installWindowStorage();
    const result = await saveLikedMatch(
      failingMatchClient(),
      "user-1",
      baseMatch({ status: "hidden" })
    );

    assert.equal(result.ok, true);
    assert.equal(result.source, "local");
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].status, "active");
    assert.deepEqual([...readStoredLikedMatchIds("user-1")], ["anna"]);
    assert.equal(events.includes("truekind:match-state-updated"), true);
  });

  it("loads local active matches when backend query fails", async () => {
    installWindowStorage();
    await saveLikedMatch(failingMatchClient(), "user-1", baseMatch());

    const result = await loadStoredMatchSource(failingMatchClient(), "user-1");

    assert.equal(result.source, "local");
    assert.equal(result.reason, "backend-error-local");
    assert.equal(result.isFallback, true);
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].match_id, "anna");
  });

  it("removes hidden matches from local visible fallback", async () => {
    installWindowStorage();
    const match = baseMatch();

    await saveLikedMatch(failingMatchClient(), "user-1", match);
    const result = await updateLikedMatchStatus(
      failingMatchClient(),
      "user-1",
      match,
      "hidden"
    );

    assert.equal(result.ok, true);
    assert.equal(result.source, "local");
    assert.equal(result.matches.length, 0);
    assert.deepEqual(readStoredLikedMatches("user-1"), []);
  });
});
