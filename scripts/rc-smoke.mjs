#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_TIMEOUT_MS = 20000;

const routeChecks = [
  {
    id: "route.home",
    label: "Startsida",
    path: "/",
    markers: ["TrueKind", "Skapa konto", "Logga in"],
  },
  {
    id: "route.login",
    label: "Login",
    path: "/login",
    markers: ["Logga in", "Välkommen tillbaka"],
  },
  {
    id: "route.register",
    label: "Register",
    path: "/register",
    markers: ["Skapa konto", "TrueKind-konto"],
  },
  {
    id: "route.onboarding",
    label: "Onboarding",
    path: "/onboarding",
    markers: ["Onboarding", "Kom igång med TrueKind"],
  },
  {
    id: "route.discover",
    label: "Discover",
    path: "/discover",
    markers: ["Discover", "Förslag att utforska"],
  },
  {
    id: "route.match",
    label: "Match",
    path: "/match",
    markers: ["Match", "Det känns som en match"],
  },
  {
    id: "route.matches",
    label: "Matchlista",
    path: "/matches",
    markers: ["Matchlista", "matchningar"],
  },
  {
    id: "route.messages",
    label: "Meddelanden",
    path: "/messages",
    markers: ["Meddelanden", "Inga samtal ännu"],
  },
  {
    id: "route.profile",
    label: "Profil",
    path: "/profile",
    markers: ["Min profil", "Det här är du i TrueKind"],
  },
  {
    id: "route.voice",
    label: "Röstprofil",
    path: "/voice",
    markers: ["Röstprofil", "Låt din röst bära känslan"],
  },
  {
    id: "route.internal-readiness",
    label: "Intern readiness",
    path: "/internal/readiness",
    markers: ["Intern readiness", "Backendkontroll för TrueKind"],
  },
];

const requiredDocs = [
  "INTERNAL_TEST_READINESS.md",
  "RC_HANDOFF_TEMPLATE.md",
  "REGRESSION_MATRIX_V4.md",
  "INTERNAL_BUG_LOG.md",
  "INTERNAL_RELEASE_NOTES_TEMPLATE.md",
  "DEMO_CHECKLIST.md",
];

const requiredSqlSnippets = [
  "profiles",
  "discover_candidates",
  "matches",
  "messages_demo",
  "profile-images",
  "voice-profiles",
  "video-presentations",
  "anna",
  "sara",
  "elin",
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] ?? "";
}

function normalizeBaseUrl(input) {
  const value = (input || DEFAULT_BASE_URL).trim();
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeTimeoutMs(input) {
  const parsed = Number(input || DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function parseDotEnv(text) {
  const entries = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) entries[key] = value;
  }

  return entries;
}

async function readLocalEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!existsSync(envPath)) return {};

  const text = await readFile(envPath, "utf8");
  return parseDotEnv(text);
}

function looksLikeSupabaseUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function looksLikeSupabasePublicKey(key) {
  if (!key) return false;
  if (key.startsWith("sb_publishable_")) return true;
  if (key.startsWith("eyJ") && key.split(".").length === 3) return true;
  return key.length >= 40;
}

function pass(id, label, detail) {
  return { status: "pass", id, label, detail };
}

function fail(id, label, detail) {
  return { status: "fail", id, label, detail };
}

async function checkSupabaseEnv() {
  const localEnv = await readLocalEnv();
  const env = { ...localEnv, ...process.env };
  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  if (!url) {
    return fail(
      "setup.env",
      "Supabase env",
      "NEXT_PUBLIC_SUPABASE_URL saknas i .env.local eller miljön."
    );
  }

  if (!looksLikeSupabaseUrl(url)) {
    return fail(
      "setup.env",
      "Supabase env",
      "NEXT_PUBLIC_SUPABASE_URL ser inte ut som en giltig URL."
    );
  }

  if (!key) {
    return fail(
      "setup.env",
      "Supabase env",
      "Publik Supabase-nyckel saknas. Ange NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY eller NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!looksLikeSupabasePublicKey(key)) {
    return fail(
      "setup.env",
      "Supabase env",
      "Publik Supabase-nyckel ser ofullständig ut."
    );
  }

  return pass(
    "setup.env",
    "Supabase env",
    "Supabase URL och publik nyckel finns med rimligt format."
  );
}

async function checkRequiredDocs() {
  const missing = requiredDocs.filter(
    (file) => !existsSync(path.join(projectRoot, file))
  );

  if (missing.length) {
    return fail(
      "setup.docs",
      "RC-dokument",
      `Saknar dokument: ${missing.join(", ")}.`
    );
  }

  return pass(
    "setup.docs",
    "RC-dokument",
    "Readiness, handoff, regression, bug-logg, release notes och demo-checklista finns."
  );
}

async function checkSupabaseSetupSql() {
  const sqlPath = path.join(projectRoot, "supabase-internal-setup.sql");
  if (!existsSync(sqlPath)) {
    return fail(
      "setup.sql",
      "Supabase setup SQL",
      "supabase-internal-setup.sql saknas."
    );
  }

  const sql = (await readFile(sqlPath, "utf8")).toLowerCase();
  const missing = requiredSqlSnippets.filter(
    (snippet) => !sql.includes(snippet.toLowerCase())
  );

  if (missing.length) {
    return fail(
      "setup.sql",
      "Supabase setup SQL",
      `Saknar väntade setup-delar: ${missing.join(", ")}.`
    );
  }

  return pass(
    "setup.sql",
    "Supabase setup SQL",
    "Setup SQL innehåller väntade tabeller, buckets och global Discover-seed."
  );
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "truekind-rc-smoke/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRoute(route, baseUrl, timeoutMs) {
  const url = `${baseUrl}${route.path}`;

  let response;
  try {
    response = await fetchWithTimeout(url, timeoutMs);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Timeout efter ${timeoutMs} ms.`
        : error instanceof Error
          ? error.message
          : String(error);

    return fail(
      route.id,
      route.label,
      `Kunde inte hämta ${url}. Starta appen med npm run dev. ${message}`
    );
  }

  if (response.status < 200 || response.status >= 400) {
    return fail(
      route.id,
      route.label,
      `${route.path} svarade med HTTP ${response.status}.`
    );
  }

  const text = await response.text();
  const missingMarkers = route.markers.filter((marker) => !text.includes(marker));

  if (missingMarkers.length) {
    return fail(
      route.id,
      route.label,
      `${route.path} saknar väntad text: ${missingMarkers.join(", ")}.`
    );
  }

  return pass(
    route.id,
    route.label,
    `${route.path} svarade ${response.status} och innehåller väntade markörer.`
  );
}

function printResult(result) {
  const label = result.status === "pass" ? "PASS" : "FAIL";
  console.log(`[${label}] ${result.label} (${result.id})`);
  console.log(`       ${result.detail}`);
}

async function main() {
  const baseUrl = normalizeBaseUrl(
    getArg("--base-url") || process.env.TRUEKIND_SMOKE_BASE_URL
  );
  const timeoutMs = normalizeTimeoutMs(
    getArg("--timeout-ms") ||
      process.env.TRUEKIND_SMOKE_TIMEOUT_MS ||
      DEFAULT_TIMEOUT_MS
  );

  console.log("TrueKind RC smoke");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Timeout: ${timeoutMs} ms`);
  console.log("");

  const setupResults = await Promise.all([
    checkSupabaseEnv(),
    checkRequiredDocs(),
    checkSupabaseSetupSql(),
  ]);

  const routeResults = [];
  for (const route of routeChecks) {
    routeResults.push(await checkRoute(route, baseUrl, timeoutMs));
  }

  const results = [...setupResults, ...routeResults];
  results.forEach(printResult);

  const failures = results.filter((result) => result.status === "fail");

  console.log("");
  if (failures.length) {
    console.error(
      `RC smoke hittade ${failures.length} fel av ${results.length} kontroller.`
    );
    process.exitCode = 1;
    return;
  }

  console.log(`RC smoke passerade ${results.length} kontroller.`);
}

await main();
