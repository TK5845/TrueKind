import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MATCH_STATUS,
  isVisibleMatch,
  isVisibleMatchStatus,
  normalizeMatchStatus,
  type CanonicalMatch,
} from "../app/lib/match-model";

function matchWithStatus(status: CanonicalMatch["status"]) {
  return { status } as CanonicalMatch;
}

describe("match lifecycle helpers", () => {
  it("normalizes unknown statuses to active", () => {
    assert.equal(normalizeMatchStatus("active"), MATCH_STATUS.active);
    assert.equal(normalizeMatchStatus("hidden"), MATCH_STATUS.hidden);
    assert.equal(normalizeMatchStatus("archived"), MATCH_STATUS.archived);
    assert.equal(normalizeMatchStatus("paused"), MATCH_STATUS.active);
    assert.equal(normalizeMatchStatus(null), MATCH_STATUS.active);
  });

  it("treats only active matches as visible", () => {
    assert.equal(isVisibleMatchStatus("active"), true);
    assert.equal(isVisibleMatchStatus("hidden"), false);
    assert.equal(isVisibleMatchStatus("archived"), false);
    assert.equal(isVisibleMatch(matchWithStatus("active")), true);
    assert.equal(isVisibleMatch(matchWithStatus("hidden")), false);
    assert.equal(isVisibleMatch(matchWithStatus("archived")), false);
  });
});
