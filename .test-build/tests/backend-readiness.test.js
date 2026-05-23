"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const backend_readiness_1 = require("../app/lib/backend-readiness");
function check(status) {
    return {
        id: status,
        title: status,
        status,
        detail: status,
    };
}
(0, node_test_1.describe)("backend readiness helpers", () => {
    (0, node_test_1.it)("detects missing global seed candidate ids", () => {
        strict_1.default.deepEqual((0, backend_readiness_1.getMissingGlobalCandidateIds)([
            { match_id: "anna" },
            { match_id: "ELIN" },
        ]), ["sara"]);
    });
    (0, node_test_1.it)("passes when all expected global seed candidates are present", () => {
        strict_1.default.deepEqual((0, backend_readiness_1.getMissingGlobalCandidateIds)([
            { match_id: "anna" },
            { match_id: "sara" },
            { match_id: "elin" },
        ]), []);
    });
    (0, node_test_1.it)("summarizes readiness status by highest severity", () => {
        strict_1.default.equal((0, backend_readiness_1.getOverallReadinessStatus)([check("pass")]), "pass");
        strict_1.default.equal((0, backend_readiness_1.getOverallReadinessStatus)([check("pass"), check("warn")]), "warn");
        strict_1.default.equal((0, backend_readiness_1.getOverallReadinessStatus)([check("warn"), check("fail")]), "fail");
        strict_1.default.equal((0, backend_readiness_1.getOverallReadinessStatus)([check("skip")]), "skip");
    });
});
