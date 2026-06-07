import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveQuerySelection } from "../app/lib/query-selection";

const items = [
  { id: "anna", label: "Anna" },
  { id: "sara", label: "Sara" },
];

function resolve(input: {
  queryId?: string | null;
  selectedId?: string | null;
  shouldFlagUnavailableQuery?: boolean;
  list?: typeof items;
}) {
  return resolveQuerySelection(input.list ?? items, {
    queryId: input.queryId ?? null,
    selectedId: input.selectedId ?? null,
    shouldFlagUnavailableQuery: input.shouldFlagUnavailableQuery ?? true,
    getId: (item) => item.id,
  });
}

describe("query selection helpers", () => {
  it("uses the selected item when the query id exists", () => {
    const result = resolve({ queryId: "sara", selectedId: "sara" });

    assert.equal(result.hasUnavailableQuery, false);
    assert.equal(result.queryItem?.id, "sara");
    assert.equal(result.selectedItem?.id, "sara");
  });

  it("detects unavailable query ids without falling back to another item", () => {
    const result = resolve({ queryId: "missing-test-id", selectedId: "anna" });

    assert.equal(result.hasUnavailableQuery, true);
    assert.equal(result.queryItem, null);
    assert.equal(result.selectedItem, null);
  });

  it("keeps normal default selection when there is no query id", () => {
    const result = resolve({ selectedId: null });

    assert.equal(result.hasUnavailableQuery, false);
    assert.equal(result.queryItem, null);
    assert.equal(result.selectedItem?.id, "anna");
  });

  it("keeps explicit selected id behavior when there is no query id", () => {
    const result = resolve({ selectedId: "sara" });

    assert.equal(result.hasUnavailableQuery, false);
    assert.equal(result.selectedItem?.id, "sara");
  });

  it("keeps empty lists safe", () => {
    const result = resolve({ list: [], queryId: null, selectedId: null });

    assert.equal(result.hasUnavailableQuery, false);
    assert.equal(result.queryItem, null);
    assert.equal(result.selectedItem, null);
  });

  it("waits to flag unavailable query ids until the caller says data is ready", () => {
    const result = resolve({
      queryId: "missing-test-id",
      selectedId: null,
      shouldFlagUnavailableQuery: false,
    });

    assert.equal(result.hasUnavailableQuery, false);
    assert.equal(result.queryItem, null);
    assert.equal(result.selectedItem?.id, "anna");
  });
});
