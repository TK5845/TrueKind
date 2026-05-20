"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConversationViews = getDefaultConversationViews;
exports.conversationViewsFromMessageResult = conversationViewsFromMessageResult;
exports.loadConversationViews = loadConversationViews;
exports.loadConversationSource = loadConversationSource;
exports.loadUnreadSummary = loadUnreadSummary;
exports.loadUnreadSummaryForUser = loadUnreadSummaryForUser;
exports.markConversationRead = markConversationRead;
const message_model_1 = require("./message-model");
const match_model_1 = require("./match-model");
function conversationSourceResult(input) {
    var _a, _b;
    return {
        source: input.source,
        conversations: input.conversations,
        reason: input.reason,
        usedMinimumColumns: (_a = input.usedMinimumColumns) !== null && _a !== void 0 ? _a : false,
        isFallback: input.source === "seed" || input.source === "fallback",
        error: (_b = input.error) !== null && _b !== void 0 ? _b : null,
    };
}
function getDefaultConversationViews(matches = match_model_1.DEMO_MATCHES, options = {}) {
    return (0, message_model_1.buildConversationViews)([], matches, options);
}
function conversationViewsFromMessageResult(result, matches = match_model_1.DEMO_MATCHES, options = {}) {
    var _a;
    if (!result || result.error)
        return getDefaultConversationViews(matches, options);
    return (0, message_model_1.buildConversationViews)((_a = result.data) !== null && _a !== void 0 ? _a : [], matches, options);
}
function selectMessages(client, columns, userId) {
    let query = client.from("messages_demo").select(columns);
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.order("sent_at", { ascending: true });
}
async function loadConversationViews(client, userId, matches = match_model_1.DEMO_MATCHES) {
    return (await loadConversationSource(client, userId, matches)).conversations;
}
async function loadConversationSource(client, userId, matches = match_model_1.DEMO_MATCHES) {
    var _a, _b, _c;
    if (userId === null) {
        return conversationSourceResult({
            source: "seed",
            conversations: getDefaultConversationViews(matches),
            reason: "demo-signed-out",
        });
    }
    const messageClient = client;
    const includeSeedMessages = !userId;
    const fallbackSource = includeSeedMessages ? "seed" : "fallback";
    try {
        const result = await selectMessages(messageClient, message_model_1.MESSAGE_SELECT_COLUMNS, userId);
        if (!result.error) {
            const conversations = conversationViewsFromMessageResult(result, matches, {
                includeSeedMessages,
            });
            const hasRows = Boolean((_a = result.data) === null || _a === void 0 ? void 0 : _a.length);
            return conversationSourceResult({
                source: hasRows ? "messages" : includeSeedMessages ? "seed" : "empty",
                conversations,
                reason: hasRows
                    ? "backend-user"
                    : includeSeedMessages
                        ? "demo-seed"
                        : "backend-empty",
            });
        }
    }
    catch (_d) {
        // Fall through to the minimum column set below. Older demo tables may not
        // have read_at/is_read yet, but saved message text should still load.
    }
    try {
        const result = await selectMessages(messageClient, message_model_1.MESSAGE_MINIMUM_SELECT_COLUMNS, userId);
        const conversations = conversationViewsFromMessageResult(result, matches, {
            includeSeedMessages,
        });
        const hasRows = Boolean((_b = result.data) === null || _b === void 0 ? void 0 : _b.length);
        return conversationSourceResult({
            source: hasRows ? "messages" : includeSeedMessages ? "seed" : "empty",
            conversations,
            reason: hasRows
                ? "minimum-columns"
                : includeSeedMessages
                    ? "demo-seed"
                    : "backend-empty",
            usedMinimumColumns: true,
            error: (_c = result.error) !== null && _c !== void 0 ? _c : null,
        });
    }
    catch (error) {
        return conversationSourceResult({
            source: fallbackSource,
            conversations: getDefaultConversationViews(matches, {
                includeSeedMessages,
            }),
            reason: "unavailable",
            error,
        });
    }
}
async function loadUnreadSummary(client) {
    return (0, message_model_1.getUnreadSummary)(await loadConversationViews(client));
}
async function loadUnreadSummaryForUser(client, userId, visibleMatchIds) {
    var _a, _b;
    if (!userId) {
        return (0, message_model_1.getUnreadSummary)(await loadConversationViews(client, userId));
    }
    const messageClient = client;
    const visibleMatchIdSet = visibleMatchIds
        ? new Set(Array.from(visibleMatchIds).filter(Boolean))
        : null;
    function summarizeRows(rows) {
        if (!visibleMatchIdSet) {
            return (0, message_model_1.getUnreadSummaryFromRows)(rows);
        }
        const messages = rows
            .map((row) => (0, message_model_1.normalizeMessage)(row))
            .filter((message) => Boolean(message && visibleMatchIdSet.has(message.match_id)));
        return (0, message_model_1.getUnreadSummaryFromMessages)(messages);
    }
    try {
        const result = await selectMessages(messageClient, message_model_1.MESSAGE_SELECT_COLUMNS, userId);
        if (!result.error) {
            return summarizeRows((_a = result.data) !== null && _a !== void 0 ? _a : []);
        }
    }
    catch (_c) {
        // Fall through to the minimum column set below for older demo tables.
    }
    try {
        const result = await selectMessages(messageClient, message_model_1.MESSAGE_MINIMUM_SELECT_COLUMNS, userId);
        if (!result.error) {
            return summarizeRows((_b = result.data) !== null && _b !== void 0 ? _b : []);
        }
    }
    catch (_d) { }
    return {
        total_unread_count: 0,
        unread_conversation_count: 0,
    };
}
async function markConversationRead(client, userId, matchId, readAt = new Date().toISOString()) {
    if (!userId)
        return { ok: false, readAt };
    const messageClient = client;
    try {
        const result = await messageClient
            .from("messages_demo")
            .update({
            read_at: readAt,
            is_read: true,
        })
            .eq("user_id", userId)
            .eq("match_id", matchId)
            .eq("sender", "them");
        if (!result.error) {
            void messageClient
                .from("matches")
                .update({
                unread_count: 0,
            })
                .eq("user_id", userId)
                .eq("match_id", matchId);
        }
        return { ok: !result.error, readAt };
    }
    catch (_a) {
        return { ok: false, readAt };
    }
}
