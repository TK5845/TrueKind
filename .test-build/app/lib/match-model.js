"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_MATCHES = exports.MATCH_STATUS = void 0;
exports.normalizeMatchStatus = normalizeMatchStatus;
exports.isVisibleMatchStatus = isVisibleMatchStatus;
exports.isVisibleMatch = isVisibleMatch;
exports.normalizeMatchId = normalizeMatchId;
exports.applySignalsToMatches = applySignalsToMatches;
exports.buildMatchSignals = buildMatchSignals;
exports.buildMatchViews = buildMatchViews;
exports.buildMatchViewsFromConversations = buildMatchViewsFromConversations;
exports.buildMatchViewsFromSource = buildMatchViewsFromSource;
exports.buildDiscoverCandidates = buildDiscoverCandidates;
exports.buildDiscoverCandidateViews = buildDiscoverCandidateViews;
exports.MATCH_STATUS = {
    active: "active",
    hidden: "hidden",
    archived: "archived",
};
function normalizeMatchStatus(value) {
    return value === exports.MATCH_STATUS.archived || value === exports.MATCH_STATUS.hidden
        ? value
        : exports.MATCH_STATUS.active;
}
function isVisibleMatchStatus(value) {
    return normalizeMatchStatus(value) === exports.MATCH_STATUS.active;
}
function isVisibleMatch(match) {
    return isVisibleMatchStatus(match.status);
}
const DEMO_TIMESTAMP = "2026-01-01T00:00:00.000Z";
exports.DEMO_MATCHES = [
    {
        match_id: "anna",
        target_profile_id: "demo-profile-anna",
        name: "Anna",
        age: 34,
        city: "Malmö",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
        chemistry_label: "Varm, jordnära, nyfiken",
        about_text: "Tycker om djupa samtal, tydlig energi och människor som känns äkta direkt.",
        looking_for: "Djupare kontakt",
        activity_label: "Konsert",
        interests: ["samtal", "musik", "närvaro"],
        latest_signal_text: "",
        latest_signal_at: "",
        unread_count: 0,
        status: "active",
        created_at: DEMO_TIMESTAMP,
        updated_at: DEMO_TIMESTAMP,
    },
    {
        match_id: "sara",
        target_profile_id: "demo-profile-sara",
        name: "Sara",
        age: 29,
        city: "Lund",
        image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
        chemistry_label: "Lättsam, skarp, social",
        about_text: "Gillar humor, snabb kemi och människor som både kan vara lätta och seriösa.",
        looking_for: "Någon att lära känna",
        activity_label: "Virtuell kaffe",
        interests: ["kaffe", "humor", "spontant"],
        latest_signal_text: "",
        latest_signal_at: "",
        unread_count: 0,
        status: "active",
        created_at: DEMO_TIMESTAMP,
        updated_at: DEMO_TIMESTAMP,
    },
    {
        match_id: "elin",
        target_profile_id: "demo-profile-elin",
        name: "Elin",
        age: 37,
        city: "Helsingborg",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
        chemistry_label: "Eftertänksam, varm, kulturell",
        about_text: "Trivs bäst i samtal med djup, kultur, musik och människor som vågar vara mjuka.",
        looking_for: "Långvarig relation",
        activity_label: "Bokprat",
        interests: ["böcker", "konserter", "kultur"],
        latest_signal_text: "",
        latest_signal_at: "",
        unread_count: 0,
        status: "active",
        created_at: DEMO_TIMESTAMP,
        updated_at: DEMO_TIMESTAMP,
    },
];
function normalizeMatchId(value) {
    var _a;
    const matchId = (_a = value === null || value === void 0 ? void 0 : value.trim().toLowerCase()) !== null && _a !== void 0 ? _a : "";
    return /^[a-z0-9_-]+$/.test(matchId) ? matchId : null;
}
function applySignalsToMatches(signals, matches = exports.DEMO_MATCHES) {
    return matches.map((match) => {
        var _a, _b, _c;
        const signal = signals.find((item) => item.match_id === match.match_id);
        return Object.assign(Object.assign({}, match), { latest_signal_text: (_a = signal === null || signal === void 0 ? void 0 : signal.latest_signal_text) !== null && _a !== void 0 ? _a : match.latest_signal_text, latest_signal_at: (_b = signal === null || signal === void 0 ? void 0 : signal.latest_signal_at) !== null && _b !== void 0 ? _b : match.latest_signal_at, unread_count: (_c = signal === null || signal === void 0 ? void 0 : signal.unread_count) !== null && _c !== void 0 ? _c : match.unread_count, updated_at: (signal === null || signal === void 0 ? void 0 : signal.latest_signal_at) || match.updated_at });
    });
}
function buildMatchSignals(conversations) {
    return conversations.map((conversation) => ({
        match_id: conversation.id,
        latest_signal_text: conversation.latest_message_text,
        latest_signal_at: conversation.latest_message_at,
        unread_count: conversation.unread_count,
        has_unread: conversation.has_unread,
        last_read_at: conversation.last_read_at,
    }));
}
function getActivityTime(value) {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}
function buildMatchViews(signals, matches = exports.DEMO_MATCHES) {
    const signalsByMatch = new Map(signals.map((signal) => [signal.match_id, signal]));
    return applySignalsToMatches(signals, matches)
        .map((match) => {
        var _a, _b;
        const signal = signalsByMatch.get(match.match_id);
        const hasLatestMessage = Boolean(match.latest_signal_text && match.latest_signal_at);
        return Object.assign(Object.assign({}, match), { conversation_id: match.match_id, latest_message_text: match.latest_signal_text, latest_message_at: match.latest_signal_at, preview_text: match.latest_signal_text || match.about_text, preview_source: hasLatestMessage
                ? "message"
                : "fallback", activity_at: match.latest_signal_at || match.updated_at, has_latest_message: hasLatestMessage, has_unread: (_a = signal === null || signal === void 0 ? void 0 : signal.has_unread) !== null && _a !== void 0 ? _a : match.unread_count > 0, last_read_at: (_b = signal === null || signal === void 0 ? void 0 : signal.last_read_at) !== null && _b !== void 0 ? _b : null });
    })
        .sort((a, b) => {
        const activityDifference = getActivityTime(b.activity_at) - getActivityTime(a.activity_at);
        if (activityDifference !== 0)
            return activityDifference;
        return a.name.localeCompare(b.name, "sv-SE");
    });
}
function buildMatchViewsFromConversations(conversations = []) {
    return buildMatchViews(buildMatchSignals(conversations));
}
function buildMatchViewsFromSource(matches = exports.DEMO_MATCHES, conversations = []) {
    return buildMatchViews(buildMatchSignals(conversations), matches);
}
function normalizeText(value) {
    var _a;
    return (_a = value === null || value === void 0 ? void 0 : value.trim().toLowerCase()) !== null && _a !== void 0 ? _a : "";
}
function getCandidateScore(candidate, profile) {
    var _a;
    if (!profile)
        return 0;
    const profileCity = normalizeText(profile.city);
    const profileIntent = normalizeText(profile.lookingFor || profile.contactIntent);
    const profileActivity = normalizeText(profile.activityInterest);
    const profileInterests = new Set(((_a = profile.interests) !== null && _a !== void 0 ? _a : []).map((item) => normalizeText(item)).filter(Boolean));
    let score = 0;
    if (profileCity && normalizeText(candidate.city) === profileCity) {
        score += 3;
    }
    if (profileIntent &&
        normalizeText(candidate.looking_for).includes(profileIntent)) {
        score += 2;
    }
    if (profileActivity &&
        normalizeText(candidate.activity_label).includes(profileActivity)) {
        score += 2;
    }
    for (const interest of candidate.interests) {
        if (profileInterests.has(normalizeText(interest))) {
            score += 1;
        }
    }
    return score;
}
function getRelevanceLabel(score) {
    if (score >= 3)
        return "Matchar din profil";
    if (score > 0)
        return "Delar några signaler";
    return "Utforska i lugn takt";
}
function buildDiscoverCandidates(profile, signals = [], matches = exports.DEMO_MATCHES, source = "demo") {
    return buildMatchViews(signals, matches).map((match) => {
        const score = getCandidateScore(match, profile);
        return Object.assign(Object.assign({}, match), { candidate_id: match.target_profile_id, source, bio: match.about_text, profile_prompt: match.preview_text, relevance_label: getRelevanceLabel(score) });
    }).sort((a, b) => {
        const scoreDifference = getCandidateScore(b, profile) - getCandidateScore(a, profile);
        if (scoreDifference !== 0)
            return scoreDifference;
        const activityDifference = getActivityTime(b.activity_at) - getActivityTime(a.activity_at);
        if (activityDifference !== 0)
            return activityDifference;
        return a.name.localeCompare(b.name, "sv-SE");
    });
}
function buildDiscoverCandidateViews(profile, conversations = [], matches = exports.DEMO_MATCHES, source = "demo") {
    return buildDiscoverCandidates(profile, buildMatchSignals(conversations), matches, source);
}
