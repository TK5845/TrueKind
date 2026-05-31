import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getConversationRowEmphasisStyle } from "../app/lib/message-row-style";

describe("conversation row emphasis styles", () => {
  it("uses active row chrome before attention state chrome", () => {
    assert.deepEqual(
      getConversationRowEmphasisStyle({
        state: "needs-reply",
        isActive: true,
        activeBackground: "active",
        neutralBackground: "neutral",
      }),
      {
        border: "1px solid rgba(17,17,17,0.16)",
        background: "active",
        isActionable: true,
      }
    );
  });

  it("emphasizes rows that need a reply", () => {
    assert.deepEqual(
      getConversationRowEmphasisStyle({
        state: "needs-reply",
        isActive: false,
        activeBackground: "active",
        neutralBackground: "neutral",
      }),
      {
        border: "1px solid rgba(17,17,17,0.24)",
        background: "rgba(255,255,255,0.94)",
        isActionable: true,
      }
    );
  });

  it("emphasizes rows that need follow-up", () => {
    assert.deepEqual(
      getConversationRowEmphasisStyle({
        state: "follow-up",
        isActive: false,
        activeBackground: "active",
        neutralBackground: "neutral",
      }),
      {
        border: "1px solid rgba(124,93,70,0.28)",
        background: "rgba(255,255,255,0.94)",
        isActionable: true,
      }
    );
  });

  it("keeps neutral rows quiet", () => {
    assert.deepEqual(
      getConversationRowEmphasisStyle({
        state: "neutral",
        isActive: false,
        activeBackground: "active",
        neutralBackground: "neutral",
      }),
      {
        border: "1px solid rgba(231,223,218,0.95)",
        background: "neutral",
        isActionable: false,
      }
    );
  });

  it("allows a caller-provided actionable background", () => {
    assert.equal(
      getConversationRowEmphasisStyle({
        state: "follow-up",
        isActive: false,
        activeBackground: "active",
        neutralBackground: "neutral",
        actionableBackground: "actionable",
      }).background,
      "actionable"
    );
  });
});
