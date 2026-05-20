"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const discover_candidate_db_1 = require("../app/lib/discover-candidate-db");
function discoverClient(input) {
    let scoped = false;
    function query(rows) {
        return {
            eq() {
                scoped = true;
                return query(input.scopedRows);
            },
            order() {
                var _a;
                if (input.error) {
                    return Promise.resolve({ data: null, error: input.error });
                }
                return Promise.resolve({
                    data: scoped ? (_a = input.scopedRows) !== null && _a !== void 0 ? _a : [] : rows !== null && rows !== void 0 ? rows : [],
                    error: null,
                });
            },
        };
    }
    return {
        from() {
            scoped = false;
            return {
                select() {
                    return query(input.globalRows);
                },
            };
        },
    };
}
(0, node_test_1.describe)("discover candidate source state", () => {
    (0, node_test_1.it)("reports user-scoped backend candidates when available", async () => {
        const result = await (0, discover_candidate_db_1.loadStoredDiscoverCandidates)(discoverClient({
            scopedRows: [
                {
                    match_id: "anna",
                    target_profile_id: "anna",
                    name: "Anna",
                    status: "active",
                    updated_at: "2026-01-01T00:00:00.000Z",
                },
            ],
        }), "user-1");
        strict_1.default.equal(result.source, "backend");
        strict_1.default.equal(result.scope, "user");
        strict_1.default.equal(result.reason, "backend-user");
        strict_1.default.equal(result.isFallback, false);
        strict_1.default.equal(result.candidates.length, 1);
    });
    (0, node_test_1.it)("marks global backend candidates as fallback for signed-in users", async () => {
        const result = await (0, discover_candidate_db_1.loadStoredDiscoverCandidates)(discoverClient({
            scopedRows: [],
            globalRows: [
                {
                    match_id: "sara",
                    target_profile_id: "sara",
                    name: "Sara",
                    status: "active",
                    updated_at: "2026-01-01T00:00:00.000Z",
                },
            ],
        }), "user-1");
        strict_1.default.equal(result.source, "backend");
        strict_1.default.equal(result.scope, "global");
        strict_1.default.equal(result.reason, "backend-global");
        strict_1.default.equal(result.isFallback, true);
        strict_1.default.equal(result.candidates.length, 1);
    });
});
