import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildConversationRowPreview,
  buildSelectedConversationContext,
  getConversationAttentionState,
  getUnreadSummaryFromRows,
  isUnreadForCurrentUser,
  markConversationReadInViews,
  normalizeMessage,
  shouldShowFollowUpCue,
  type ConversationView,
  type MessageRow,
} from "../app/lib/message-model";

describe("message unread helpers", () => {
  it("counts only unread messages from the other person", () => {
    const rows: MessageRow[] = [
      {
        id: "them-unread",
        match_id: "anna",
        sender: "them",
        message_text: "Hej",
        sent_at: "2026-01-01T10:00:00.000Z",
        is_read: false,
      },
      {
        id: "me-unread-flag",
        match_id: "anna",
        sender: "me",
        message_text: "Hej tillbaka",
        sent_at: "2026-01-01T10:01:00.000Z",
        is_read: false,
      },
      {
        id: "them-read",
        match_id: "sara",
        sender: "them",
        message_text: "Läst",
        sent_at: "2026-01-01T10:02:00.000Z",
        read_at: "2026-01-01T10:03:00.000Z",
        is_read: true,
      },
    ];

    assert.equal(isUnreadForCurrentUser(normalizeMessage(rows[0])!), true);
    assert.equal(isUnreadForCurrentUser(normalizeMessage(rows[1])!), false);
    assert.deepEqual(getUnreadSummaryFromRows(rows), {
      total_unread_count: 1,
      unread_conversation_count: 1,
    });
  });

  it("marks selected conversation messages from them as read", () => {
    const conversations: ConversationView[] = [
      {
        id: "anna",
        name: "Anna",
        age: 34,
        city: "Malmö",
        image: "",
        chemistry: "Varm",
        latest_message_text: "Hej",
        latest_message_at: "2026-01-01T10:00:00.000Z",
        last_read_at: null,
        unread_count: 1,
        unread_message_ids: ["a1"],
        has_unread: true,
        messages: [
          {
            id: "a1",
            match_id: "anna",
            sender: "them",
            message_text: "Hej",
            sent_at: "2026-01-01T10:00:00.000Z",
            read_at: null,
            is_read: false,
          },
          {
            id: "a2",
            match_id: "anna",
            sender: "me",
            message_text: "Hej tillbaka",
            sent_at: "2026-01-01T10:01:00.000Z",
            read_at: "2026-01-01T10:01:00.000Z",
            is_read: true,
          },
        ],
      },
    ];

    const next = markConversationReadInViews(
      conversations,
      "anna",
      "2026-01-01T10:05:00.000Z"
    );

    assert.equal(next[0].has_unread, false);
    assert.equal(next[0].unread_count, 0);
    assert.deepEqual(next[0].unread_message_ids, []);
    assert.equal(next[0].messages[0].is_read, true);
    assert.equal(next[0].messages[0].read_at, "2026-01-01T10:05:00.000Z");
    assert.equal(next[0].messages[1].read_at, "2026-01-01T10:01:00.000Z");
  });
});

describe("conversation row preview helpers", () => {
  it("makes unread latest messages from them clearly actionable", () => {
    assert.equal(
      buildConversationRowPreview({
        name: "Anna",
        latestMessageText: "Hur ser en riktigt bra kväll ut för dig?",
        latestSender: "them",
        state: "needs-reply",
      }),
      "Anna väntar på svar: Hur ser en riktigt bra kväll ut för dig?"
    );
  });

  it("labels my latest message without making the row feel unread", () => {
    assert.equal(
      buildConversationRowPreview({
        name: "Sara",
        latestMessageText: "Jag hör gärna mer om det.",
        latestSender: "me",
        state: "neutral",
      }),
      "Du skrev senast: Jag hör gärna mer om det."
    );
  });

  it("uses follow-up copy when my latest message has gone stale", () => {
    assert.equal(
      buildConversationRowPreview({
        name: "Elin",
        latestMessageText: "Vill du fortsätta prata om konserter?",
        latestSender: "me",
        state: "follow-up",
      }),
      "Du kan följa upp: Vill du fortsätta prata om konserter?"
    );
  });

  it("uses mild match context when no messages exist", () => {
    assert.equal(
      buildConversationRowPreview({
        name: "Anna",
        fallbackInterests: ["samtal", "musik", "närvaro"],
        fallbackActivityLabel: "Konsert",
      }),
      "Anna har en naturlig startpunkt i samtal och musik."
    );
  });

  it("keeps sparse no-message rows useful", () => {
    assert.equal(
      buildConversationRowPreview({}),
      "Inget samtal ännu. Börja enkelt och personligt."
    );
  });
});

describe("selected conversation context helpers", () => {
  const now = Date.parse("2026-01-10T12:00:00.000Z");

  it("keeps unread latest messages from them in needs-reply context", () => {
    const context = buildSelectedConversationContext({
      name: "Anna",
      latestMessageText: "Hur ser en riktigt bra kväll ut för dig?",
      latestSender: "them",
      hasUnread: true,
      hasLatestMessage: true,
      latestMessageAt: "2026-01-10T09:31:00.000Z",
      now,
    });

    assert.deepEqual(context, {
      state: "needs-reply",
      preview:
        "Anna väntar på svar: Hur ser en riktigt bra kväll ut för dig?",
    });
  });

  it("keeps stale latest messages from me in follow-up context", () => {
    const context = buildSelectedConversationContext({
      name: "Elin",
      latestMessageText: "Vill du fortsätta prata om konserter?",
      latestSender: "me",
      hasUnread: false,
      hasLatestMessage: true,
      latestMessageAt: "2026-01-02T12:00:00.000Z",
      now,
    });

    assert.deepEqual(context, {
      state: "follow-up",
      preview: "Du kan följa upp: Vill du fortsätta prata om konserter?",
    });
  });

  it("keeps recent latest conversations neutral", () => {
    const context = buildSelectedConversationContext({
      name: "Sara",
      latestMessageText: "Jag hade gärna tagit den där virtuella kaffen.",
      latestSender: "them",
      hasUnread: false,
      hasLatestMessage: true,
      latestMessageAt: "2026-01-10T11:00:00.000Z",
      now,
    });

    assert.deepEqual(context, {
      state: "neutral",
      preview:
        "Sara skrev senast: Jag hade gärna tagit den där virtuella kaffen.",
    });
  });

  it("uses useful match context when there is no latest message", () => {
    const context = buildSelectedConversationContext({
      name: "Anna",
      latestSender: null,
      hasUnread: false,
      hasLatestMessage: false,
      latestMessageAt: "",
      fallbackInterests: ["samtal", "musik", "närvaro"],
      fallbackActivityLabel: "Konsert",
      now,
    });

    assert.deepEqual(context, {
      state: "neutral",
      preview: "Anna har en naturlig startpunkt i samtal och musik.",
    });
  });

  it("keeps sparse fallback context safe and Swedish", () => {
    const context = buildSelectedConversationContext({
      hasUnread: false,
      hasLatestMessage: false,
      latestMessageAt: "",
      now,
    });

    assert.deepEqual(context, {
      state: "neutral",
      preview: "Inget samtal ännu. Börja enkelt och personligt.",
    });
  });
});

describe("message attention helpers", () => {
  const now = Date.parse("2026-01-10T12:00:00.000Z");

  function followUpInput(
    overrides: Partial<Parameters<typeof shouldShowFollowUpCue>[0]> = {}
  ): Parameters<typeof shouldShowFollowUpCue>[0] {
    return {
      hasUnread: false,
      hasLatestMessage: true,
      latestMessageAt: "2026-01-02T12:00:00.000Z",
      latestSender: "me",
      now,
      ...overrides,
    };
  }

  it("never shows follow-up for unread rows", () => {
    assert.equal(
      shouldShowFollowUpCue(followUpInput({ hasUnread: true })),
      false
    );
  });

  it("shows follow-up when my latest message has gone stale", () => {
    assert.equal(shouldShowFollowUpCue(followUpInput()), true);
  });

  it("does not show follow-up when their latest message has gone stale", () => {
    assert.equal(
      shouldShowFollowUpCue(followUpInput({ latestSender: "them" })),
      false
    );
  });

  it("does not show follow-up when my latest message is still fresh", () => {
    assert.equal(
      shouldShowFollowUpCue(
        followUpInput({ latestMessageAt: "2026-01-09T12:00:00.000Z" })
      ),
      false
    );
  });

  it("does not show follow-up for missing or invalid timestamps", () => {
    assert.equal(
      shouldShowFollowUpCue(followUpInput({ latestMessageAt: "" })),
      false
    );
    assert.equal(
      shouldShowFollowUpCue(followUpInput({ latestMessageAt: "not-a-date" })),
      false
    );
  });

  it("does not show follow-up when there is no latest message", () => {
    assert.equal(
      shouldShowFollowUpCue(followUpInput({ hasLatestMessage: false })),
      false
    );
  });

  it("returns needs-reply for unread rows", () => {
    assert.equal(
      getConversationAttentionState(followUpInput({ hasUnread: true })),
      "needs-reply"
    );
  });

  it("returns follow-up when my latest message has gone stale", () => {
    assert.equal(getConversationAttentionState(followUpInput()), "follow-up");
  });

  it("returns neutral for read rows without a stale latest message from me", () => {
    assert.equal(
      getConversationAttentionState(
        followUpInput({ latestMessageAt: "2026-01-09T12:00:00.000Z" })
      ),
      "neutral"
    );
  });
});
