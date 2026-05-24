import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MATCH_STATUS,
  buildFirstMessageGuide,
  buildMatchInsights,
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

describe("match insight helpers", () => {
  it("builds first-message guidance from existing match context", () => {
    const guide = buildFirstMessageGuide({
      name: "Anna",
      chemistry_label: "Varm, jordnÃ¤ra, nyfiken",
      about_text: "Tycker om djupa samtal och tydlig energi.",
      activity_label: "Konsert",
      interests: ["samtal", "musik", "nÃ¤rvaro"],
    });

    assert.match(guide.insight, /Anna/);
    assert.match(guide.insight, /samtal och musik/);
    assert.equal(guide.suggestions.length, 3);
    assert.match(guide.suggestions[0], /Hej Anna/);
    assert.match(guide.suggestions[0], /samtal/);
    assert.match(guide.suggestions[1], /konsert/i);
  });

  it("keeps first-message guidance useful with sparse match context", () => {
    const guide = buildFirstMessageGuide({
      name: "Sara",
      chemistry_label: "",
      about_text: "",
      activity_label: "",
      interests: [],
    });

    assert.match(guide.insight, /Sara/);
    assert.equal(guide.suggestions.length, 2);
    assert.match(guide.suggestions[0], /första pratstund/);
    assert.match(guide.suggestions[1], /börja enkelt/);
  });

  it("derives stable Swedish insights from existing match fields", () => {
    const insights = buildMatchInsights({
      name: "Anna",
      chemistry_label: "Varm, jordnära, nyfiken",
      about_text: "Tycker om djupa samtal och tydlig energi.",
      looking_for: "Djupare kontakt",
      activity_label: "Konsert",
      interests: ["samtal", "musik", "närvaro"],
      latest_message_text: "Jag gillade verkligen din röstprofil.",
    });

    assert.deepEqual(
      insights.map((insight) => insight.label),
      ["Känslan", "Bra startpunkt", "Nästa steg"]
    );
    assert.match(insights[0].text, /Varm, jordnära, nyfiken/);
    assert.match(insights[1].text, /samtal, musik och närvaro/);
    assert.match(insights[1].text, /djupare kontakt/);
    assert.match(insights[2].text, /Jag gillade verkligen din röstprofil/);
  });

  it("keeps a useful first-step insight when messages are missing", () => {
    const insights = buildMatchInsights({
      name: "Sara",
      chemistry_label: "Lättsam, skarp, social",
      about_text: "Gillar humor och snabb kemi.",
      looking_for: "Någon att lära känna",
      activity_label: "Virtuell kaffe",
      interests: ["kaffe"],
    });

    assert.equal(insights.length, 3);
    assert.equal(insights[2].id, "continuity");
    assert.match(insights[2].text, /inget samtal ännu/);
  });

  it("does not invent empty feeling or starting-point insights", () => {
    const insights = buildMatchInsights({});

    assert.deepEqual(insights, [
      {
        id: "continuity",
        label: "Nästa steg",
        text: "Det finns inget samtal ännu, så första steget kan vara enkelt, varmt och personligt.",
      },
    ]);
  });
});
