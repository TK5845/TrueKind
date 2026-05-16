import type { CanonicalMatch } from "./match-model";

type UnknownRecord = Record<string, unknown>;

type CandidateQueryResult = {
  data?: unknown[] | null;
  error?: unknown;
};

type DiscoverCandidateClient = {
  from(table: string): {
    select(columns: string): CandidateQuery;
  };
};

type CandidateQuery = PromiseLike<CandidateQueryResult> & {
  eq(column: string, value: string): CandidateQuery;
  order(column: string, options: { ascending: boolean }): CandidateQuery;
};

export type CandidateSource = "backend" | "demo";

export type StoredCandidateResult = {
  source: CandidateSource;
  candidates: CanonicalMatch[];
  error: unknown | null;
};

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function cleanString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function cleanNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function cleanList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeStatus(value: unknown): CanonicalMatch["status"] {
  return value === "archived" || value === "hidden" ? value : "active";
}

export function normalizeStoredCandidate(input: unknown): CanonicalMatch | null {
  const row = asRecord(input);
  const matchId = cleanString(row.match_id, row.id).toLowerCase();
  const targetProfileId = cleanString(
    row.target_profile_id,
    row.profile_id,
    row.candidate_profile_id,
    matchId
  );
  const name = cleanString(row.name, row.first_name, row.display_name);
  const city = cleanString(row.city, row.location);

  if (!matchId || !targetProfileId || !name) return null;

  return {
    match_id: matchId,
    target_profile_id: targetProfileId,
    name,
    age: cleanNumber(row.age),
    city,
    image: cleanString(
      row.image,
      row.image_url,
      row.profile_image_url,
      row.avatar_url
    ),
    chemistry_label: cleanString(
      row.chemistry_label,
      row.chemistry,
      "Utforska i lugn takt"
    ),
    about_text: cleanString(row.about_text, row.bio, row.description),
    looking_for: cleanString(row.looking_for, row.contact_intent),
    activity_label: cleanString(row.activity_label, row.activity_interest),
    interests: cleanList(row.interests),
    latest_signal_text: cleanString(
      row.latest_signal_text,
      row.latest_message_text
    ),
    latest_signal_at: cleanString(row.latest_signal_at, row.latest_message_at),
    unread_count: cleanNumber(row.unread_count),
    status: normalizeStatus(row.status),
    created_at: cleanString(row.created_at, new Date().toISOString()),
    updated_at: cleanString(row.updated_at, row.created_at, new Date().toISOString()),
  };
}

function sortCandidates(candidates: CanonicalMatch[]) {
  return [...candidates].sort((a, b) => {
    const updatedDifference =
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();

    if (Number.isFinite(updatedDifference) && updatedDifference !== 0) {
      return updatedDifference;
    }

    return a.name.localeCompare(b.name, "sv-SE");
  });
}

function normalizeCandidateRows(data: unknown[] | null | undefined) {
  return (data ?? [])
    .map((row) => normalizeStoredCandidate(row))
    .filter((candidate): candidate is CanonicalMatch =>
      Boolean(candidate && candidate.status === "active")
    );
}

async function queryDiscoverCandidates(
  client: DiscoverCandidateClient,
  userId?: string | null
) {
  let query = client.from("discover_candidates").select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.order("updated_at", { ascending: false });
}

export async function loadStoredDiscoverCandidates(
  client: unknown,
  userId?: string | null
): Promise<StoredCandidateResult> {
  const discoverClient = client as DiscoverCandidateClient;

  try {
    let scopedQuerySucceeded = false;
    const scopedResult = userId
      ? await queryDiscoverCandidates(discoverClient, userId)
      : null;

    if (scopedResult && !scopedResult.error) {
      scopedQuerySucceeded = true;
      const scopedCandidates = normalizeCandidateRows(scopedResult.data);

      if (scopedCandidates.length) {
        return {
          source: "backend",
          candidates: sortCandidates(scopedCandidates),
          error: null,
        };
      }
    }

    const result = await queryDiscoverCandidates(discoverClient);

    if (result.error) {
      if (scopedQuerySucceeded) {
        return {
          source: "backend",
          candidates: [],
          error: null,
        };
      }

      return {
        source: "demo",
        candidates: [],
        error: result.error,
      };
    }

    const candidates = normalizeCandidateRows(result.data);

    return {
      source: "backend",
      candidates: sortCandidates(candidates),
      error: null,
    };
  } catch (error) {
    return {
      source: "demo",
      candidates: [],
      error,
    };
  }
}
