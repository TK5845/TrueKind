"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const message_model_1 = require("../app/lib/message-model");
(0, node_test_1.describe)("message unread helpers", () => {
    (0, node_test_1.it)("counts only unread messages from the other person", () => {
        const rows = [
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
        strict_1.default.equal((0, message_model_1.isUnreadForCurrentUser)((0, message_model_1.normalizeMessage)(rows[0])), true);
        strict_1.default.equal((0, message_model_1.isUnreadForCurrentUser)((0, message_model_1.normalizeMessage)(rows[1])), false);
        strict_1.default.deepEqual((0, message_model_1.getUnreadSummaryFromRows)(rows), {
            total_unread_count: 1,
            unread_conversation_count: 1,
        });
    });
    (0, node_test_1.it)("marks selected conversation messages from them as read", () => {
        const conversations = [
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
        const next = (0, message_model_1.markConversationReadInViews)(conversations, "anna", "2026-01-01T10:05:00.000Z");
        strict_1.default.equal(next[0].has_unread, false);
        strict_1.default.equal(next[0].unread_count, 0);
        strict_1.default.deepEqual(next[0].unread_message_ids, []);
        strict_1.default.equal(next[0].messages[0].is_read, true);
        strict_1.default.equal(next[0].messages[0].read_at, "2026-01-01T10:05:00.000Z");
        strict_1.default.equal(next[0].messages[1].read_at, "2026-01-01T10:01:00.000Z");
    });
});
