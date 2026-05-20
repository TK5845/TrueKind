"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_MESSAGES = exports.MESSAGE_READ_STATE_UPDATED_EVENT = exports.MESSAGE_MINIMUM_SELECT_COLUMNS = exports.MESSAGE_SELECT_COLUMNS = void 0;
exports.getTime = getTime;
exports.normalizeMessage = normalizeMessage;
exports.getLatestMessage = getLatestMessage;
exports.isUnreadForCurrentUser = isUnreadForCurrentUser;
exports.getLastReadAt = getLastReadAt;
exports.getConversationReadState = getConversationReadState;
exports.getUnreadSummary = getUnreadSummary;
exports.getUnreadSummaryFromRows = getUnreadSummaryFromRows;
exports.getUnreadSummaryFromMessages = getUnreadSummaryFromMessages;
exports.formatUnreadCount = formatUnreadCount;
exports.buildConversationViews = buildConversationViews;
exports.getConversationPreview = getConversationPreview;
exports.appendMessageToConversationViews = appendMessageToConversationViews;
exports.markConversationReadInViews = markConversationReadInViews;
const match_model_1 = require("./match-model");
exports.MESSAGE_SELECT_COLUMNS = "id,match_id,sender,message_text,sent_at,read_at,is_read";
exports.MESSAGE_MINIMUM_SELECT_COLUMNS = "id,match_id,sender,message_text,sent_at";
exports.MESSAGE_READ_STATE_UPDATED_EVENT = "truekind:message-read-state";
function conversationProfilesFromMatches(matches = match_model_1.DEMO_MATCHES) {
    return matches.map((match) => ({
        id: match.match_id,
        name: match.name,
        age: match.age,
        city: match.city,
        image: match.image,
        chemistry: match.chemistry_label,
    }));
}
exports.BASE_MESSAGES = [
    {
        id: "a1",
        match_id: "anna",
        sender: "them",
        message_text: "Hej! Jag såg att du gillar djupa samtal.",
        sent_at: "2026-01-10T09:18:00.000Z",
        read_at: "2026-01-10T09:18:00.000Z",
        is_read: true,
    },
    {
        id: "a2",
        match_id: "anna",
        sender: "me",
        message_text: "Ja, absolut. Hellre äkta än bara småprat.",
        sent_at: "2026-01-10T09:24:00.000Z",
        read_at: "2026-01-10T09:24:00.000Z",
        is_read: true,
    },
    {
        id: "a3",
        match_id: "anna",
        sender: "them",
        message_text: "Samma här. Hur ser en riktigt bra kväll ut för dig?",
        sent_at: "2026-01-10T09:31:00.000Z",
        read_at: "2026-01-10T09:31:00.000Z",
        is_read: true,
    },
    {
        id: "a4",
        match_id: "anna",
        sender: "me",
        message_text: "Bra energi, lugn stämning och någon som faktiskt vill prata på riktigt.",
        sent_at: "2026-01-10T09:37:00.000Z",
        read_at: "2026-01-10T09:37:00.000Z",
        is_read: true,
    },
    {
        id: "a5",
        match_id: "anna",
        sender: "them",
        message_text: "Det där lät faktiskt som en riktigt bra idé.",
        sent_at: "2026-01-10T09:42:00.000Z",
        read_at: "2026-01-10T09:42:00.000Z",
        is_read: true,
    },
    {
        id: "s1",
        match_id: "sara",
        sender: "them",
        message_text: "Du verkar ha en lugn energi.",
        sent_at: "2026-01-09T18:02:00.000Z",
        read_at: "2026-01-09T18:02:00.000Z",
        is_read: true,
    },
    {
        id: "s2",
        match_id: "sara",
        sender: "me",
        message_text: "Tack, det tar jag som en komplimang.",
        sent_at: "2026-01-09T18:06:00.000Z",
        read_at: "2026-01-09T18:06:00.000Z",
        is_read: true,
    },
    {
        id: "s3",
        match_id: "sara",
        sender: "them",
        message_text: "Jag hade gärna tagit den där virtuella kaffen.",
        sent_at: "2026-01-09T18:11:00.000Z",
        read_at: "2026-01-09T18:11:00.000Z",
        is_read: true,
    },
    {
        id: "e1",
        match_id: "elin",
        sender: "them",
        message_text: "Jag såg att du också gillar konserter.",
        sent_at: "2026-01-05T14:07:00.000Z",
        read_at: "2026-01-05T14:07:00.000Z",
        is_read: true,
    },
    {
        id: "e2",
        match_id: "elin",
        sender: "me",
        message_text: "Ja, gärna live. Det blir en helt annan känsla.",
        sent_at: "2026-01-05T14:15:00.000Z",
        read_at: "2026-01-05T14:15:00.000Z",
        is_read: true,
    },
    {
        id: "e3",
        match_id: "elin",
        sender: "them",
        message_text: "Vi verkar faktiskt gilla ganska lika saker.",
        sent_at: "2026-01-05T14:22:00.000Z",
        read_at: "2026-01-05T14:22:00.000Z",
        is_read: true,
    },
];
function getTime(value) {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}
function normalizeSender(value) {
    return value === "them" ? "them" : "me";
}
function normalizeReadState(input) {
    if (!input.hasReadAtField && !input.hasIsReadField) {
        return true;
    }
    if (typeof input.isRead === "boolean")
        return input.isRead;
    if (input.readAt)
        return true;
    return input.sender === "me";
}
function normalizeMessage(row) {
    const matchId = typeof row.match_id === "string" ? (0, match_model_1.normalizeMatchId)(row.match_id) : null;
    const text = typeof row.message_text === "string" ? row.message_text : "";
    const sentAt = typeof row.sent_at === "string" ? row.sent_at : "";
    if (!matchId || !text || !sentAt)
        return null;
    const sender = normalizeSender(row.sender);
    const hasReadAtField = Object.prototype.hasOwnProperty.call(row, "read_at");
    const hasIsReadField = Object.prototype.hasOwnProperty.call(row, "is_read");
    const readAt = typeof row.read_at === "string" ? row.read_at : null;
    return {
        id: typeof row.id === "string" ? row.id : `${matchId}-${sentAt}`,
        match_id: matchId,
        sender,
        message_text: text,
        sent_at: sentAt,
        read_at: readAt,
        is_read: normalizeReadState({
            sender,
            readAt,
            isRead: row.is_read,
            hasReadAtField,
            hasIsReadField,
        }),
    };
}
function getLatestMessage(messages) {
    return messages.reduce((latest, message) => {
        if (!latest)
            return message;
        return getTime(message.sent_at) > getTime(latest.sent_at) ? message : latest;
    }, null);
}
function isUnreadForCurrentUser(message) {
    return message.sender === "them" && !message.is_read;
}
function getLastReadAt(messages) {
    return messages.reduce((latestReadAt, message) => {
        if (message.sender !== "them" || !message.read_at)
            return latestReadAt;
        return getTime(message.read_at) > getTime(latestReadAt !== null && latestReadAt !== void 0 ? latestReadAt : "")
            ? message.read_at
            : latestReadAt;
    }, null);
}
function getConversationReadState(messages) {
    const unreadMessages = messages.filter(isUnreadForCurrentUser);
    return {
        last_read_at: getLastReadAt(messages),
        unread_count: unreadMessages.length,
        unread_message_ids: unreadMessages.map((message) => message.id),
        has_unread: unreadMessages.length > 0,
    };
}
function getUnreadSummary(conversations) {
    return conversations.reduce((summary, conversation) => ({
        total_unread_count: summary.total_unread_count + conversation.unread_count,
        unread_conversation_count: summary.unread_conversation_count + (conversation.has_unread ? 1 : 0),
    }), {
        total_unread_count: 0,
        unread_conversation_count: 0,
    });
}
function getUnreadSummaryFromRows(rows) {
    const messages = rows
        .map((row) => normalizeMessage(row))
        .filter((message) => Boolean(message));
    return getUnreadSummaryFromMessages(messages);
}
function getUnreadSummaryFromMessages(messages) {
    const unreadMessages = messages.filter(isUnreadForCurrentUser);
    const unreadMatchIds = new Set(unreadMessages.map((message) => message.match_id));
    return {
        total_unread_count: unreadMessages.length,
        unread_conversation_count: unreadMatchIds.size,
    };
}
function formatUnreadCount(count) {
    if (count <= 0)
        return "";
    return count === 1 ? "1 oläst" : `${count} olästa`;
}
function buildConversationView(profile, messages) {
    var _a, _b;
    const sortedMessages = [...messages].sort((a, b) => getTime(a.sent_at) - getTime(b.sent_at));
    const latest = getLatestMessage(sortedMessages);
    const readState = getConversationReadState(sortedMessages);
    return Object.assign(Object.assign(Object.assign(Object.assign({}, profile), { latest_message_text: (_a = latest === null || latest === void 0 ? void 0 : latest.message_text) !== null && _a !== void 0 ? _a : "", latest_message_at: (_b = latest === null || latest === void 0 ? void 0 : latest.sent_at) !== null && _b !== void 0 ? _b : "" }), readState), { messages: sortedMessages });
}
function sortConversationViews(conversations) {
    return [...conversations].sort((a, b) => getTime(b.latest_message_at) - getTime(a.latest_message_at));
}
function buildConversationViews(rows, matches = match_model_1.DEMO_MATCHES, options = {}) {
    var _a, _b;
    const grouped = new Map();
    const dbMessages = rows
        .map((row) => normalizeMessage(row))
        .filter((message) => Boolean(message));
    const matchIds = new Set(matches.map((match) => match.match_id));
    const includeSeedMessages = (_a = options.includeSeedMessages) !== null && _a !== void 0 ? _a : true;
    const seedMessages = includeSeedMessages
        ? exports.BASE_MESSAGES.filter((message) => matchIds.has(message.match_id))
        : [];
    for (const message of [...seedMessages, ...dbMessages]) {
        const messages = (_b = grouped.get(message.match_id)) !== null && _b !== void 0 ? _b : [];
        messages.push(message);
        grouped.set(message.match_id, messages);
    }
    return sortConversationViews(conversationProfilesFromMatches(matches).map((profile) => { var _a; return buildConversationView(profile, (_a = grouped.get(profile.id)) !== null && _a !== void 0 ? _a : []); }));
}
function getConversationPreview(conversations, id) {
    var _a;
    return (_a = conversations.find((conversation) => conversation.id === id)) !== null && _a !== void 0 ? _a : null;
}
function appendMessageToConversationViews(conversations, row, matches = match_model_1.DEMO_MATCHES) {
    const message = normalizeMessage(row);
    if (!message)
        return conversations;
    let foundConversation = false;
    const nextConversations = conversations.map((conversation) => {
        if (conversation.id !== message.match_id)
            return conversation;
        foundConversation = true;
        return buildConversationView(conversation, [
            ...conversation.messages.filter((item) => item.id !== message.id),
            message,
        ]);
    });
    if (!foundConversation) {
        const profile = conversationProfilesFromMatches(matches).find((item) => item.id === message.match_id);
        if (!profile)
            return conversations;
        nextConversations.push(buildConversationView(profile, [message]));
    }
    return sortConversationViews(nextConversations);
}
function markConversationReadInViews(conversations, matchId, readAt) {
    return sortConversationViews(conversations.map((conversation) => {
        if (conversation.id !== matchId || !conversation.has_unread) {
            return conversation;
        }
        return buildConversationView(conversation, conversation.messages.map((message) => {
            var _a;
            return message.sender === "them" && !message.is_read
                ? Object.assign(Object.assign({}, message), { read_at: (_a = message.read_at) !== null && _a !== void 0 ? _a : readAt, is_read: true }) : message;
        }));
    }));
}
