"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const message_preview_model_1 = require("../app/lib/message-preview-model");
const matches = [
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
function messageClient(rows, error = null) {
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
(0, node_test_1.describe)("message source helpers", () => {
    (0, node_test_1.it)("reports empty signed-in backend state without seed messages", async () => {
        const result = await (0, message_preview_model_1.loadConversationSource)(messageClient([]), "user-1", matches);
        strict_1.default.equal(result.source, "empty");
        strict_1.default.equal(result.reason, "backend-empty");
        strict_1.default.equal(result.isFallback, false);
        strict_1.default.equal(result.conversations.length, 2);
        strict_1.default.equal(result.conversations[0].messages.length, 0);
    });
    (0, node_test_1.it)("can scope unread summaries to visible match ids", async () => {
        const rows = [
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
        strict_1.default.deepEqual(await (0, message_preview_model_1.loadUnreadSummaryForUser)(messageClient(rows), "user-1", ["anna"]), {
            total_unread_count: 1,
            unread_conversation_count: 1,
        });
    });
});
