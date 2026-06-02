import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MATCH_STATUS,
  buildConversationContinuationGuide,
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
    assert.match(guide.suggestions[1], /samtal.*musik/i);
    assert.match(guide.suggestions[2], /konsert/i);
  });

  it("prioritizes activity when first-message interests are missing", () => {
    const guide = buildFirstMessageGuide({
      name: "Sara",
      chemistry_label: "Lättsam, skarp",
      about_text: "Gillar humor och snabb kemi.",
      activity_label: "Virtuell kaffe",
      interests: [],
    });

    assert.match(guide.insight, /virtuell kaffe/i);
    assert.equal(guide.suggestions.length, 3);
    assert.match(guide.suggestions[0], /virtuell kaffe/i);
    assert.match(guide.suggestions[1], /lättsam.*skarp/i);
  });

  it("uses about text before generic openers when context is otherwise sparse", () => {
    const guide = buildFirstMessageGuide({
      name: "Elin",
      chemistry_label: "",
      about_text: "Trivs bäst i samtal med djup och kultur.",
      activity_label: "",
      interests: [],
    });

    assert.match(guide.insight, /personlig öppning/);
    assert.equal(guide.suggestions.length, 3);
    assert.match(guide.suggestions[0], /beskriver dig/);
    assert.match(guide.suggestions[1], /första pratstund/);
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

  it("builds continuation guidance when the latest message is from them", () => {
    const guide = buildConversationContinuationGuide({
      name: "Anna",
      chemistry_label: "Varm, jordnära, nyfiken",
      interests: ["samtal", "musik"],
      activity_label: "Konsert",
      latest_message_text: "Hur ser en riktigt bra kväll ut för dig?",
      latest_message_sender: "them",
      has_unread: true,
    });

    assert.match(guide.insight, /Anna har skrivit/);
    assert.equal(guide.suggestions.length, 2);
    assert.match(guide.suggestions[0], /fastnade/);
  });

  it("builds continuation guidance when the latest message is from me", () => {
    const guide = buildConversationContinuationGuide({
      name: "Sara",
      interests: ["kaffe"],
      latest_message_text: "Jag hade gärna tagit den där virtuella kaffen.",
      latest_message_sender: "me",
      has_unread: false,
    });

    assert.match(guide.insight, /Sara har ditt senaste svar/);
    assert.equal(guide.suggestions.length, 2);
    assert.match(guide.suggestions[1], /kaffe/);
  });

  it("keeps continuation guidance useful with sparse context", () => {
    const guide = buildConversationContinuationGuide({
      latest_message_text: "Hej",
      latest_message_sender: "them",
    });

    assert.match(guide.insight, /matchningen/);
    assert.equal(guide.suggestions.length, 2);
    assert.match(guide.suggestions[1], /Hur känns/);
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
