const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function cleanEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

function readSupabaseEnv() {
  const url = cleanEnv(process.env[SUPABASE_URL_ENV]);
  const publishableKey = cleanEnv(process.env[SUPABASE_PUBLISHABLE_KEY_ENV]);
  const anonKey = cleanEnv(process.env[SUPABASE_ANON_KEY_ENV]);

  return {
    url,
    key: publishableKey || anonKey,
    hasPublishableKey: Boolean(publishableKey),
    hasAnonKey: Boolean(anonKey),
  };
}

function looksLikeSupabasePublicKey(key: string) {
  if (!key) return false;
  if (key.startsWith("sb_publishable_")) return true;
  if (key.startsWith("eyJ") && key.split(".").length === 3) return true;
  return key.length >= 40;
}

export function getSupabaseConfig() {
  const env = readSupabaseEnv();

  if (!env.url || !env.key) {
    throw new Error(
      `Missing Supabase environment variables. Set ${SUPABASE_URL_ENV} and ${SUPABASE_PUBLISHABLE_KEY_ENV} in .env.local.`
    );
  }

  return {
    url: env.url,
    key: env.key,
  };
}

export function getSupabaseConfigIssue() {
  const env = readSupabaseEnv();

  if (!env.url) {
    return `Supabase-adressen saknas i .env.local (${SUPABASE_URL_ENV}).`;
  }

  if (!env.key) {
    return `Supabase-nyckeln saknas i .env.local (${SUPABASE_PUBLISHABLE_KEY_ENV}).`;
  }

  if (!env.hasPublishableKey && env.hasAnonKey) {
    return "";
  }

  if (!looksLikeSupabasePublicKey(env.key)) {
    return "Supabase-nyckeln i .env.local ser ofullständig ut. Klistra in projektets publika anon/publishable key och starta om appen.";
  }

  return "";
}
