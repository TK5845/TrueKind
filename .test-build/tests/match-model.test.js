"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const match_model_1 = require("../app/lib/match-model");
function matchWithStatus(status) {
    return { status };
}
(0, node_test_1.describe)("match lifecycle helpers", () => {
    (0, node_test_1.it)("normalizes unknown statuses to active", () => {
        strict_1.default.equal((0, match_model_1.normalizeMatchStatus)("active"), match_model_1.MATCH_STATUS.active);
        strict_1.default.equal((0, match_model_1.normalizeMatchStatus)("hidden"), match_model_1.MATCH_STATUS.hidden);
        strict_1.default.equal((0, match_model_1.normalizeMatchStatus)("archived"), match_model_1.MATCH_STATUS.archived);
        strict_1.default.equal((0, match_model_1.normalizeMatchStatus)("paused"), match_model_1.MATCH_STATUS.active);
        strict_1.default.equal((0, match_model_1.normalizeMatchStatus)(null), match_model_1.MATCH_STATUS.active);
    });
    (0, node_test_1.it)("treats only active matches as visible", () => {
        strict_1.default.equal((0, match_model_1.isVisibleMatchStatus)("active"), true);
        strict_1.default.equal((0, match_model_1.isVisibleMatchStatus)("hidden"), false);
        strict_1.default.equal((0, match_model_1.isVisibleMatchStatus)("archived"), false);
        strict_1.default.equal((0, match_model_1.isVisibleMatch)(matchWithStatus("active")), true);
        strict_1.default.equal((0, match_model_1.isVisibleMatch)(matchWithStatus("hidden")), false);
        strict_1.default.equal((0, match_model_1.isVisibleMatch)(matchWithStatus("archived")), false);
    });
});
