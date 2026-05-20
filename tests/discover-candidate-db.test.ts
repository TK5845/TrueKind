import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadStoredDiscoverCandidates } from "../app/lib/discover-candidate-db";

function discoverClient(input: { scopedRows?: unknown[]; globalRows?: unknown[]; error?: unknown }) {
  let scoped = false;

  function query(rows: unknown[] | undefined) {
    return {
      eq() {
        scoped = true;
        return query(input.scopedRows);
      },
      order() {
        if (input.error) {
          return Promise.resolve({ data: null, error: input.error });
        }

        return Promise.resolve({
          data: scoped ? input.scopedRows ?? [] : rows ?? [],
          error: null,
        });
      },
    };
  }

  return {
    from() {
      scoped = false;
      return {
        select() {
          return query(input.globalRows);
        },
      };
    },
  };
}

describe("discover candidate source state", () => {
  it("reports user-scoped backend candidates when available", async () => {
    const result = await loadStoredDiscoverCandidates(
      discoverClient({
        scopedRows: [
          {
            match_id: "anna",
            target_profile_id: "anna",
            name: "Anna",
            status: "active",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
      "user-1"
    );

    assert.equal(result.source, "backend");
    assert.equal(result.scope, "user");
    assert.equal(result.reason, "backend-user");
    assert.equal(result.isFallback, false);
    assert.equal(result.candidates.length, 1);
  });

  it("marks global backend candidates as fallback for signed-in users", async () => {
    const result = await loadStoredDiscoverCandidates(
      discoverClient({
        scopedRows: [],
        globalRows: [
          {
            match_id: "sara",
            target_profile_id: "sara",
            name: "Sara",
            status: "active",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
      "user-1"
    );

    assert.equal(result.source, "backend");
    assert.equal(result.scope, "global");
    assert.equal(result.reason, "backend-global");
    assert.equal(result.isFallback, true);
    assert.equal(result.candidates.length, 1);
  });
});
