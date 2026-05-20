import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getUnreadSummaryFromRows,
  isUnreadForCurrentUser,
  markConversationReadInViews,
  normalizeMessage,
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
