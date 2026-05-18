import { createBrowserClient } from "@supabase/ssr";
import { createDisabledSupabaseClient } from "./disabled-client";
import { getSupabaseConfig, getSupabaseConfigIssue } from "./env";

export function createClient() {
  const issue = getSupabaseConfigIssue();

  if (issue) {
    return createDisabledSupabaseClient(issue);
  }

  const { url, key } = getSupabaseConfig();

  return createBrowserClient(
    url,
    key
  );
}
