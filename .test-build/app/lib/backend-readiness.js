"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissingGlobalCandidateIds = getMissingGlobalCandidateIds;
exports.getOverallReadinessStatus = getOverallReadinessStatus;
exports.runBackendReadinessChecks = runBackendReadinessChecks;
const env_1 = require("../../utils/supabase/env");
const profile_media_1 = require("./profile-media");
const REQUIRED_BUCKETS = [
    profile_media_1.PROFILE_IMAGE_BUCKET,
    profile_media_1.VOICE_PROFILE_BUCKET,
    profile_media_1.VIDEO_PRESENTATION_BUCKET,
];
const EXPECTED_GLOBAL_CANDIDATES = ["anna", "sara", "elin"];
function getErrorMessage(error) {
    var _a, _b;
    if (!error)
        return "";
    if (error instanceof Error)
        return error.message;
    if (typeof error === "object") {
        const record = error;
        const message = (_b = (_a = record.message) !== null && _a !== void 0 ? _a : record.error) !== null && _b !== void 0 ? _b : record.code;
        if (typeof message === "string")
            return message;
    }
    return String(error);
}
function createCheck(id, title, status, detail) {
    return {
        id,
        title,
        status,
        detail,
    };
}
function chainQuery(query, operations) {
    let current = query;
    for (const [name, args] of operations) {
        const operation = current[name];
        if (typeof operation === "function") {
            current = operation.apply(current, args);
        }
    }
    return current;
}
async function runQuery(client, table, columns, operations = [["limit", [1]]]) {
    const query = client.from(table).select(columns);
    return (await chainQuery(query, operations));
}
async function checkTableRead(input) {
    try {
        const result = await runQuery(input.client, input.table, input.columns);
        if (result.error) {
            return createCheck(input.id, input.title, "fail", `Kunde inte läsa ${input.table}: ${getErrorMessage(result.error)}`);
        }
        return createCheck(input.id, input.title, "pass", `${input.table} är läsbar med aktuell session.`);
    }
    catch (error) {
        return createCheck(input.id, input.title, "fail", `Kunde inte läsa ${input.table}: ${getErrorMessage(error)}`);
    }
}
function getMissingGlobalCandidateIds(rows) {
    const foundIds = new Set((rows !== null && rows !== void 0 ? rows : [])
        .map((row) => row && typeof row === "object"
        ? row.match_id
        : null)
        .filter((value) => typeof value === "string")
        .map((value) => value.trim().toLowerCase()));
    return EXPECTED_GLOBAL_CANDIDATES.filter((id) => !foundIds.has(id));
}
async function checkGlobalSeed(client) {
    try {
        const result = await runQuery(client, "discover_candidates", "match_id,name,status,user_id", [
            ["is", ["user_id", null]],
            ["in", ["match_id", [...EXPECTED_GLOBAL_CANDIDATES]]],
        ]);
        if (result.error) {
            return createCheck("seed.global-discover", "Global Discover-seed", "fail", `Kunde inte läsa globala kandidater: ${getErrorMessage(result.error)}`);
        }
        const missingIds = getMissingGlobalCandidateIds(result.data);
        if (missingIds.length) {
            return createCheck("seed.global-discover", "Global Discover-seed", "warn", `Saknar global seed för: ${missingIds.join(", ")}. Kör supabase-internal-setup.sql.`);
        }
        return createCheck("seed.global-discover", "Global Discover-seed", "pass", "Anna, Sara och Elin finns som globala Discover-kandidater.");
    }
    catch (error) {
        return createCheck("seed.global-discover", "Global Discover-seed", "fail", `Seed-kontrollen kunde inte köras: ${getErrorMessage(error)}`);
    }
}
async function checkBucketRead(client, bucket) {
    var _a;
    try {
        const bucketClient = (_a = client.storage) === null || _a === void 0 ? void 0 : _a.from(bucket);
        if (!(bucketClient === null || bucketClient === void 0 ? void 0 : bucketClient.list)) {
            return createCheck(`bucket.${bucket}`, `Bucket: ${bucket}`, "skip", "Storage-klienten kan inte lista buckets i den här miljön.");
        }
        const result = await bucketClient.list("", { limit: 1 });
        if (result.error) {
            return createCheck(`bucket.${bucket}`, `Bucket: ${bucket}`, "fail", `Bucket saknas eller är inte läsbar: ${getErrorMessage(result.error)}`);
        }
        return createCheck(`bucket.${bucket}`, `Bucket: ${bucket}`, "pass", "Bucketen finns och kan läsas.");
    }
    catch (error) {
        return createCheck(`bucket.${bucket}`, `Bucket: ${bucket}`, "fail", `Bucket-kontrollen kunde inte köras: ${getErrorMessage(error)}`);
    }
}
async function countRows(client, table, columns) {
    const result = await runQuery(client, table, columns, [["limit", [5]]]);
    return Array.isArray(result.data) ? result.data.length : 0;
}
async function checkUserSeed(client) {
    try {
        const [profileCount, matchCount, messageCount] = await Promise.all([
            countRows(client, "profiles", "id"),
            countRows(client, "matches", "match_id"),
            countRows(client, "messages_demo", "id,match_id"),
        ]);
        if (!profileCount) {
            return createCheck("seed.current-user", "Seed för inloggat testkonto", "warn", "Ingen profilrad hittades för aktuell användare. Kör seed-template eller spara profilen i appen.");
        }
        if (!matchCount || !messageCount) {
            return createCheck("seed.current-user", "Seed för inloggat testkonto", "warn", "Profil finns, men matchningar eller meddelanden saknas. Kör seed-template för ett rikare testläge.");
        }
        return createCheck("seed.current-user", "Seed för inloggat testkonto", "pass", "Profil, matchningar och meddelanden finns för aktuell användare.");
    }
    catch (error) {
        return createCheck("seed.current-user", "Seed för inloggat testkonto", "fail", `User seed-kontrollen kunde inte köras: ${getErrorMessage(error)}`);
    }
}
function getOverallReadinessStatus(checks) {
    if (checks.some((check) => check.status === "fail"))
        return "fail";
    if (checks.some((check) => check.status === "warn"))
        return "warn";
    if (checks.every((check) => check.status === "skip"))
        return "skip";
    return "pass";
}
function getSummary(status) {
    if (status === "pass")
        return "Backend ser redo ut för intern testning.";
    if (status === "warn") {
        return "Backend är delvis redo, men någon test- eller seed-del behöver ses över.";
    }
    if (status === "skip") {
        return "Kontrollen kunde inte avgöra backendstatus i den här miljön.";
    }
    return "Backend är inte redo. Åtgärda fel innan internt testpass.";
}
async function runBackendReadinessChecks(client) {
    var _a, _b, _c, _d, _e;
    const checkedAt = new Date().toISOString();
    const checks = [];
    const configIssue = (0, env_1.getSupabaseConfigIssue)();
    if (configIssue) {
        checks.push(createCheck("env.supabase", "Supabase-konfiguration", "fail", configIssue));
        return {
            checkedAt,
            checks,
            overallStatus: "fail",
            summary: getSummary("fail"),
        };
    }
    checks.push(createCheck("env.supabase", "Supabase-konfiguration", "pass", "Publik Supabase URL och nyckel finns."));
    let userId = "";
    try {
        const userResult = await client.auth.getUser();
        userId = (_c = (_b = (_a = userResult.data) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "";
        if (userResult.error) {
            checks.push(createCheck("auth.session", "Inloggad testare", "warn", `Kunde inte läsa session: ${getErrorMessage(userResult.error)}`));
        }
        else if (userId) {
            checks.push(createCheck("auth.session", "Inloggad testare", "pass", ((_e = (_d = userResult.data) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.email)
                ? `Inloggad som ${userResult.data.user.email}.`
                : "En inloggad testare finns."));
        }
        else {
            checks.push(createCheck("auth.session", "Inloggad testare", "warn", "Logga in med ett internt testkonto för att kontrollera RLS och användarseed."));
        }
    }
    catch (error) {
        checks.push(createCheck("auth.session", "Inloggad testare", "warn", `Sessionen kunde inte kontrolleras: ${getErrorMessage(error)}`));
    }
    checks.push(...(await Promise.all(REQUIRED_BUCKETS.map((bucket) => checkBucketRead(client, bucket)))));
    if (!userId) {
        checks.push(createCheck("tables.authenticated", "Autentiserade tabellkontroller", "skip", "Hoppar över tabell- och seedkontroller tills en intern testare är inloggad."));
    }
    else {
        checks.push(...(await Promise.all([
            checkTableRead({
                client,
                id: "table.profiles",
                title: "Tabell: profiles",
                table: "profiles",
                columns: "id,name,city,video_url",
            }),
            checkTableRead({
                client,
                id: "table.discover_candidates",
                title: "Tabell: discover_candidates",
                table: "discover_candidates",
                columns: "match_id,name,status,user_id",
            }),
            checkTableRead({
                client,
                id: "table.matches",
                title: "Tabell: matches",
                table: "matches",
                columns: "user_id,match_id,status,unread_count",
            }),
            checkTableRead({
                client,
                id: "table.messages_demo",
                title: "Tabell: messages_demo",
                table: "messages_demo",
                columns: "id,match_id,sender,message_text,sent_at,read_at,is_read",
            }),
        ])));
        checks.push(await checkGlobalSeed(client));
        checks.push(await checkUserSeed(client));
    }
    const overallStatus = getOverallReadinessStatus(checks);
    return {
        checkedAt,
        overallStatus,
        summary: getSummary(overallStatus),
        checks,
    };
}
