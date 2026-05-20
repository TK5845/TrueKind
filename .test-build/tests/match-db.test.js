"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const match_db_1 = require("../app/lib/match-db");
const originalWindow = globalThis.window;
function baseMatch(overrides = {}) {
    return Object.assign({ match_id: "anna", target_profile_id: "anna-profile", name: "Anna", age: 34, city: "Malmö", image: "", chemistry_label: "Varm", about_text: "Test", looking_for: "Kontakt", activity_label: "Kaffe", interests: [], latest_signal_text: "", latest_signal_at: "", unread_count: 0, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }, overrides);
}
function installWindowStorage() {
    const storage = new Map();
    const events = [];
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: {
            localStorage: {
                getItem(key) {
                    var _a;
                    return (_a = storage.get(key)) !== null && _a !== void 0 ? _a : null;
                },
                setItem(key, value) {
                    storage.set(key, value);
                },
                removeItem(key) {
                    storage.delete(key);
                },
            },
            dispatchEvent(event) {
                events.push(event.type);
                return true;
            },
        },
    });
    return { storage, events };
}
function failingMatchClient() {
    const result = { data: null, error: new Error("backend unavailable") };
    const query = {
        eq() {
            return query;
        },
        order() {
            return query;
        },
        then(onfulfilled, onrejected) {
            return Promise.resolve(result).then(onfulfilled, onrejected);
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
                upsert() {
                    return Promise.resolve({ error: new Error("upsert failed") });
                },
                insert() {
                    return Promise.resolve({ error: new Error("insert failed") });
                },
            };
        },
    };
}
(0, node_test_1.afterEach)(() => {
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
    });
});
(0, node_test_1.describe)("match-db local fallback", () => {
    (0, node_test_1.it)("stores likes locally as active when backend save fails", async () => {
        const { events } = installWindowStorage();
        const result = await (0, match_db_1.saveLikedMatch)(failingMatchClient(), "user-1", baseMatch({ status: "hidden" }));
        strict_1.default.equal(result.ok, true);
        strict_1.default.equal(result.source, "local");
        strict_1.default.equal(result.matches.length, 1);
        strict_1.default.equal(result.matches[0].status, "active");
        strict_1.default.deepEqual([...(0, match_db_1.readStoredLikedMatchIds)("user-1")], ["anna"]);
        strict_1.default.equal(events.includes("truekind:match-state-updated"), true);
    });
    (0, node_test_1.it)("loads local active matches when backend query fails", async () => {
        installWindowStorage();
        await (0, match_db_1.saveLikedMatch)(failingMatchClient(), "user-1", baseMatch());
        const result = await (0, match_db_1.loadStoredMatchSource)(failingMatchClient(), "user-1");
        strict_1.default.equal(result.source, "local");
        strict_1.default.equal(result.reason, "backend-error-local");
        strict_1.default.equal(result.isFallback, true);
        strict_1.default.equal(result.matches.length, 1);
        strict_1.default.equal(result.matches[0].match_id, "anna");
    });
    (0, node_test_1.it)("removes hidden matches from local visible fallback", async () => {
        installWindowStorage();
        const match = baseMatch();
        await (0, match_db_1.saveLikedMatch)(failingMatchClient(), "user-1", match);
        const result = await (0, match_db_1.updateLikedMatchStatus)(failingMatchClient(), "user-1", match, "hidden");
        strict_1.default.equal(result.ok, true);
        strict_1.default.equal(result.source, "local");
        strict_1.default.equal(result.matches.length, 0);
        strict_1.default.deepEqual((0, match_db_1.readStoredLikedMatches)("user-1"), []);
    });
});
