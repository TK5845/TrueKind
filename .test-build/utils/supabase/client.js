"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const ssr_1 = require("@supabase/ssr");
const disabled_client_1 = require("./disabled-client");
const env_1 = require("./env");
function createClient() {
    const issue = (0, env_1.getSupabaseConfigIssue)();
    if (issue) {
        return (0, disabled_client_1.createDisabledSupabaseClient)(issue);
    }
    const { url, key } = (0, env_1.getSupabaseConfig)();
    return (0, ssr_1.createBrowserClient)(url, key);
}
