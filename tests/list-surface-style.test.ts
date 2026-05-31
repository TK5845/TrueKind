import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyStateStyle, pillStyle } from "../app/lib/list-surface-style";

describe("list surface styles", () => {
  it("keeps the light pill style stable", () => {
    assert.deepEqual(pillStyle(), {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      width: "fit-content",
      padding: "9px 12px",
      borderRadius: 999,
      border: "1px solid rgba(231,223,218,0.95)",
      background: "rgba(255,255,255,0.84)",
      color: "#3e3733",
      fontSize: 13,
      fontWeight: 600,
    });
  });

  it("keeps the dark pill style stable", () => {
    assert.equal(pillStyle(true).border, "1px solid #111");
    assert.equal(pillStyle(true).background, "#111");
    assert.equal(pillStyle(true).color, "white");
  });

  it("keeps empty state panel styling stable", () => {
    assert.deepEqual(emptyStateStyle(), {
      background: "rgba(255,255,255,0.84)",
      borderRadius: 24,
      padding: 22,
      border: "1px solid rgba(231,223,218,0.95)",
      boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
      display: "grid",
      gap: 12,
    });
  });
});
