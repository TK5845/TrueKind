import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
});
