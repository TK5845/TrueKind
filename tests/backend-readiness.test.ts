import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getMissingGlobalCandidateIds,
  getOverallReadinessStatus,
  type ReadinessCheck,
} from "../app/lib/backend-readiness";

function check(status: ReadinessCheck["status"]): ReadinessCheck {
  return {
    id: status,
    title: status,
    status,
    detail: status,
  };
}

describe("backend readiness helpers", () => {
  it("detects missing global seed candidate ids", () => {
    assert.deepEqual(
      getMissingGlobalCandidateIds([
        { match_id: "anna" },
        { match_id: "ELIN" },
      ]),
      ["sara"]
    );
  });

  it("passes when all expected global seed candidates are present", () => {
    assert.deepEqual(
      getMissingGlobalCandidateIds([
        { match_id: "anna" },
        { match_id: "sara" },
        { match_id: "elin" },
      ]),
      []
    );
  });

  it("summarizes readiness status by highest severity", () => {
    assert.equal(getOverallReadinessStatus([check("pass")]), "pass");
    assert.equal(
      getOverallReadinessStatus([check("pass"), check("warn")]),
      "warn"
    );
    assert.equal(
      getOverallReadinessStatus([check("warn"), check("fail")]),
      "fail"
    );
    assert.equal(getOverallReadinessStatus([check("skip")]), "skip");
  });
});
