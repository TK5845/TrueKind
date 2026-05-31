import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getProfileInitial } from "../app/lib/profile-image";

describe("profile image helpers", () => {
  it("uses the first uppercase character from a name", () => {
    assert.equal(getProfileInitial("Anna"), "A");
  });

  it("trims whitespace before selecting the initial", () => {
    assert.equal(getProfileInitial("  sara"), "S");
  });

  it("falls back when the name is empty", () => {
    assert.equal(getProfileInitial(""), "?");
    assert.equal(getProfileInitial("   "), "?");
  });
});
