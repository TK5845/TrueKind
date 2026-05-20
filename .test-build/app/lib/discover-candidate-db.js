"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeStoredCandidate = normalizeStoredCandidate;
exports.loadStoredDiscoverCandidates = loadStoredDiscoverCandidates;
const match_model_1 = require("./match-model");
function candidateResult(input) {
    var _a;
    return {
        source: input.source,
        scope: input.scope,
        candidates: sortCandidates(input.candidates),
        reason: input.reason,
        isFallback: input.source === "demo" || input.scope === "global",
        error: (_a = input.error) !== null && _a !== void 0 ? _a : null,
    };
}
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
function cleanString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}
function cleanNumber(...values) {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string" && value.trim()) {
            const parsed = Number.parseInt(value.trim(), 10);
            if (Number.isFinite(parsed))
                return parsed;
        }
    }
    return 0;
}
function cleanList(value) {
    if (Array.isArray(value)) {
        return value
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}
function normalizeStoredCandidate(input) {
    const row = asRecord(input);
    const matchId = cleanString(row.match_id, row.id).toLowerCase();
    const targetProfileId = cleanString(row.target_profile_id, row.profile_id, row.candidate_profile_id, matchId);
    const name = cleanString(row.name, row.first_name, row.display_name);
    const city = cleanString(row.city, row.location);
    if (!matchId || !targetProfileId || !name)
        return null;
    return {
        match_id: matchId,
        target_profile_id: targetProfileId,
        name,
        age: cleanNumber(row.age),
        city,
        image: cleanString(row.image, row.image_url, row.profile_image_url, row.avatar_url),
        chemistry_label: cleanString(row.chemistry_label, row.chemistry, "Utforska i lugn takt"),
        about_text: cleanString(row.about_text, row.bio, row.description),
        looking_for: cleanString(row.looking_for, row.contact_intent),
        activity_label: cleanString(row.activity_label, row.activity_interest),
        interests: cleanList(row.interests),
        latest_signal_text: cleanString(row.latest_signal_text, row.latest_message_text),
        latest_signal_at: cleanString(row.latest_signal_at, row.latest_message_at),
        unread_count: cleanNumber(row.unread_count),
        status: (0, match_model_1.normalizeMatchStatus)(row.status),
        created_at: cleanString(row.created_at, new Date().toISOString()),
        updated_at: cleanString(row.updated_at, row.created_at, new Date().toISOString()),
    };
}
function sortCandidates(candidates) {
    return [...candidates].sort((a, b) => {
        const updatedDifference = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        if (Number.isFinite(updatedDifference) && updatedDifference !== 0) {
            return updatedDifference;
        }
        return a.name.localeCompare(b.name, "sv-SE");
    });
}
function normalizeCandidateRows(data) {
    return (data !== null && data !== void 0 ? data : [])
        .map((row) => normalizeStoredCandidate(row))
        .filter((candidate) => Boolean(candidate && candidate.status === "active"));
}
async function queryDiscoverCandidates(client, userId) {
    let query = client.from("discover_candidates").select("*");
    if (userId) {
        query = query.eq("user_id", userId);
    }
    return query.order("updated_at", { ascending: false });
}
async function loadStoredDiscoverCandidates(client, userId) {
    const discoverClient = client;
    try {
        let scopedQuerySucceeded = false;
        const scopedResult = userId
            ? await queryDiscoverCandidates(discoverClient, userId)
            : null;
        if (scopedResult && !scopedResult.error) {
            scopedQuerySucceeded = true;
            const scopedCandidates = normalizeCandidateRows(scopedResult.data);
            if (scopedCandidates.length) {
                return candidateResult({
                    source: "backend",
                    scope: "user",
                    candidates: sortCandidates(scopedCandidates),
                    reason: "backend-user",
                });
            }
        }
        const result = await queryDiscoverCandidates(discoverClient);
        if (result.error) {
            if (scopedQuerySucceeded) {
                return candidateResult({
                    source: "backend",
                    scope: "user",
                    candidates: [],
                    reason: "backend-empty",
                });
            }
            return candidateResult({
                source: "demo",
                scope: "demo",
                candidates: [],
                reason: "backend-error",
                error: result.error,
            });
        }
        const candidates = normalizeCandidateRows(result.data);
        return candidateResult({
            source: "backend",
            scope: scopedQuerySucceeded ? "global" : "global",
            candidates: sortCandidates(candidates),
            reason: scopedQuerySucceeded ? "backend-global" : "backend-global",
        });
    }
    catch (error) {
        return candidateResult({
            source: "demo",
            scope: "demo",
            candidates: [],
            reason: "backend-error",
            error,
        });
    }
}
