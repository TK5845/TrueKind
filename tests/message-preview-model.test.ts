import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadConversationSource,
  loadUnreadSummaryForUser,
} from "../app/lib/message-preview-model";
import type { CanonicalMatch } from "../app/lib/match-model";
import type { MessageRow } from "../app/lib/message-model";

const matches: CanonicalMatch[] = [
  {
    match_id: "anna",
    target_profile_id: "anna",
    name: "Anna",
    age: 34,
    city: "Malmö",
    image: "",
    chemistry_label: "Varm",
    about_text: "Test",
    looking_for: "Kontakt",
    activity_label: "Kaffe",
    interests: [],
    latest_signal_text: "",
    latest_signal_at: "",
    unread_count: 0,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    match_id: "sara",
    target_profile_id: "sara",
    name: "Sara",
    age: 29,
    city: "Lund",
    image: "",
    chemistry_label: "Lugn",
    about_text: "Test",
    looking_for: "Kontakt",
    activity_label: "Bok",
    interests: [],
    latest_signal_text: "",
    latest_signal_at: "",
    unread_count: 0,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

function messageClient(rows: MessageRow[], error: unknown = null) {
  const query = {
    eq() {
      return query;
    },
    order() {
      return Promise.resolve({ data: rows, error });
    },
  };

  return {
    from() {
      return {
        select() {
          return query;
        },
        update() {
          return query;
        },
      };
    },
  };
}

describe("message source helpers", () => {
  it("reports empty signed-in backend state without seed messages", async () => {
    const result = await loadConversationSource(messageClient([]), "user-1", matches);

    assert.equal(result.source, "empty");
    assert.equal(result.reason, "backend-empty");
    assert.equal(result.isFallback, false);
    assert.equal(result.conversations.length, 2);
    assert.equal(result.conversations[0].messages.length, 0);
  });

  it("can scope unread summaries to visible match ids", async () => {
    const rows: MessageRow[] = [
      {
        id: "visible-unread",
        match_id: "anna",
        sender: "them",
        message_text: "Synlig",
        sent_at: "2026-01-01T10:00:00.000Z",
        is_read: false,
      },
      {
        id: "hidden-unread",
        match_id: "sara",
        sender: "them",
        message_text: "Dold",
        sent_at: "2026-01-01T10:01:00.000Z",
        is_read: false,
      },
    ];

    assert.deepEqual(
      await loadUnreadSummaryForUser(messageClient(rows), "user-1", ["anna"]),
      {
        total_unread_count: 1,
        unread_conversation_count: 1,
      }
    );
  });
});
