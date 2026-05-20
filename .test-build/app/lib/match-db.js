"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MATCH_STATE_UPDATED_EVENT = void 0;
exports.readStoredLikedMatches = readStoredLikedMatches;
exports.readStoredLikedMatchIds = readStoredLikedMatchIds;
exports.storeLikedMatchLocally = storeLikedMatchLocally;
exports.saveLikedMatch = saveLikedMatch;
exports.updateLikedMatchStatus = updateLikedMatchStatus;
exports.loadStoredMatchSource = loadStoredMatchSource;
const discover_candidate_db_1 = require("./discover-candidate-db");
const match_model_1 = require("./match-model");
exports.MATCH_STATE_UPDATED_EVENT = "truekind:match-state-updated";
const LIKED_MATCHES_STORAGE_PREFIX = "truekind_liked_matches";
function matchSourceResult(input) {
    var _a;
    return {
        source: input.source,
        matches: sortMatches(input.matches),
        reason: input.reason,
        isFallback: input.source !== "matches",
        error: (_a = input.error) !== null && _a !== void 0 ? _a : null,
    };
}
function sortMatches(matches) {
    return [...matches].sort((a, b) => {
        const updatedDifference = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        if (Number.isFinite(updatedDifference) && updatedDifference !== 0) {
            return updatedDifference;
        }
        return a.name.localeCompare(b.name, "sv-SE");
    });
}
function getStoredLikedMatchesKey(userId) {
    return `${LIKED_MATCHES_STORAGE_PREFIX}:${userId || "local"}`;
}
function dedupeMatches(matches) {
    const byId = new Map();
    for (const match of matches) {
        if (!match.match_id)
            continue;
        byId.set(match.match_id, Object.assign(Object.assign(Object.assign({}, byId.get(match.match_id)), match), { status: (0, match_model_1.normalizeMatchStatus)(match.status) }));
    }
    return Array.from(byId.values());
}
function normalizeMatchForStorage(match) {
    var _a;
    const now = new Date().toISOString();
    return Object.assign(Object.assign({}, match), { match_id: match.match_id.trim().toLowerCase(), target_profile_id: match.target_profile_id || match.match_id, latest_signal_text: match.latest_signal_text || "", latest_signal_at: match.latest_signal_at || "", unread_count: (_a = match.unread_count) !== null && _a !== void 0 ? _a : 0, status: (0, match_model_1.normalizeMatchStatus)(match.status), created_at: match.created_at || now, updated_at: now });
}
function readStoredLikedMatches(userId) {
    if (typeof window === "undefined")
        return [];
    try {
        const raw = window.localStorage.getItem(getStoredLikedMatchesKey(userId));
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .map((item) => (0, discover_candidate_db_1.normalizeStoredCandidate)(item))
            .filter((match) => Boolean(match && (0, match_model_1.isVisibleMatch)(match)));
    }
    catch (_a) {
        return [];
    }
}
function writeStoredLikedMatches(userId, matches) {
    if (typeof window === "undefined")
        return;
    try {
        const normalized = sortMatches(dedupeMatches(matches).map(normalizeMatchForStorage));
        window.localStorage.setItem(getStoredLikedMatchesKey(userId), JSON.stringify(normalized));
        window.dispatchEvent(new Event(exports.MATCH_STATE_UPDATED_EVENT));
    }
    catch (_a) {
        // localStorage can be unavailable in restricted browser contexts.
    }
}
function readStoredLikedMatchIds(userId) {
    return new Set(readStoredLikedMatches(userId).map((match) => match.match_id));
}
function storeLikedMatchLocally(userId, match) {
    const current = readStoredLikedMatches(userId);
    const next = dedupeMatches([
        ...current,
        normalizeMatchForStorage(Object.assign(Object.assign({}, match), { status: match_model_1.MATCH_STATUS.active })),
    ]);
    writeStoredLikedMatches(userId, next);
    return sortMatches(next);
}
function toMatchPayload(userId, match) {
    const normalized = normalizeMatchForStorage(match);
    return {
        user_id: userId,
        match_id: normalized.match_id,
        target_profile_id: normalized.target_profile_id,
        name: normalized.name,
        age: normalized.age,
        city: normalized.city,
        image: normalized.image,
        chemistry_label: normalized.chemistry_label,
        about_text: normalized.about_text,
        looking_for: normalized.looking_for,
        activity_label: normalized.activity_label,
        interests: normalized.interests,
        latest_signal_text: normalized.latest_signal_text,
        latest_signal_at: normalized.latest_signal_at,
        unread_count: normalized.unread_count,
        status: normalized.status,
        created_at: normalized.created_at,
        updated_at: normalized.updated_at,
    };
}
async function saveLikedMatch(client, userId, match) {
    var _a;
    const activeMatch = Object.assign(Object.assign({}, match), { status: match_model_1.MATCH_STATUS.active });
    const localMatches = storeLikedMatchLocally(userId, activeMatch);
    const matchClient = client;
    const payload = toMatchPayload(userId, activeMatch);
    try {
        let result = await matchClient
            .from("matches")
            .upsert(payload, { onConflict: "user_id,match_id" });
        if (result.error) {
            result = await matchClient.from("matches").insert(payload);
        }
        return {
            ok: true,
            source: result.error ? "local" : "matches",
            matches: localMatches,
            error: (_a = result.error) !== null && _a !== void 0 ? _a : null,
        };
    }
    catch (error) {
        return {
            ok: true,
            source: "local",
            matches: localMatches,
            error,
        };
    }
}
async function updateLikedMatchStatus(client, userId, match, status) {
    var _a;
    const normalized = normalizeMatchForStorage(Object.assign(Object.assign({}, match), { status }));
    const current = readStoredLikedMatches(userId).filter((item) => item.match_id !== normalized.match_id);
    const next = (0, match_model_1.isVisibleMatch)(normalized)
        ? dedupeMatches([...current, normalized])
        : current;
    writeStoredLikedMatches(userId, next);
    const matchClient = client;
    try {
        let result = await matchClient
            .from("matches")
            .update({
            status,
            updated_at: normalized.updated_at,
        })
            .eq("user_id", userId)
            .eq("match_id", normalized.match_id);
        if (result.error) {
            result = await matchClient
                .from("matches")
                .upsert(toMatchPayload(userId, normalized), {
                onConflict: "user_id,match_id",
            });
        }
        return {
            ok: true,
            source: result.error ? "local" : "matches",
            matches: sortMatches(next),
            error: (_a = result.error) !== null && _a !== void 0 ? _a : null,
        };
    }
    catch (error) {
        return {
            ok: true,
            source: "local",
            matches: sortMatches(next),
            error,
        };
    }
}
async function queryUserMatches(client, userId, options) {
    let query = client.from("matches").select("*").eq("user_id", userId);
    if (options.includeStatusFilter) {
        query = query.eq("status", "active");
    }
    if (options.includeUpdatedOrder) {
        query = query.order("updated_at", { ascending: false });
    }
    return query;
}
async function loadUserMatches(client, userId) {
    var _a;
    const matchClient = client;
    try {
        let result = await queryUserMatches(matchClient, userId, {
            includeStatusFilter: true,
            includeUpdatedOrder: true,
        });
        if (result.error) {
            result = await queryUserMatches(matchClient, userId, {
                includeStatusFilter: false,
                includeUpdatedOrder: false,
            });
        }
        const localMatches = readStoredLikedMatches(userId);
        if (result.error) {
            if (localMatches.length) {
                return matchSourceResult({
                    source: "local",
                    matches: sortMatches(localMatches),
                    reason: "backend-error-local",
                    error: result.error,
                });
            }
            return matchSourceResult({
                source: "demo",
                matches: [],
                reason: "backend-error",
                error: result.error,
            });
        }
        const matches = ((_a = result.data) !== null && _a !== void 0 ? _a : [])
            .map((row) => (0, discover_candidate_db_1.normalizeStoredCandidate)(row))
            .filter((match) => Boolean(match && (0, match_model_1.isVisibleMatch)(match)));
        if (matches.length) {
            return matchSourceResult({
                source: "matches",
                matches: sortMatches(dedupeMatches(matches)),
                reason: "backend-user",
            });
        }
        if (localMatches.length) {
            return matchSourceResult({
                source: "local",
                matches: sortMatches(localMatches),
                reason: "local-cache",
            });
        }
        return matchSourceResult({
            source: "matches",
            matches: [],
            reason: "backend-empty",
        });
    }
    catch (error) {
        const localMatches = readStoredLikedMatches(userId);
        if (localMatches.length) {
            return matchSourceResult({
                source: "local",
                matches: sortMatches(localMatches),
                reason: "backend-error-local",
                error,
            });
        }
        return matchSourceResult({
            source: "demo",
            matches: [],
            reason: "backend-error",
            error,
        });
    }
}
async function loadStoredMatchSource(client, userId) {
    if (userId) {
        return loadUserMatches(client, userId);
    }
    return matchSourceResult({
        source: "demo",
        matches: [],
        reason: "demo-signed-out",
    });
}
