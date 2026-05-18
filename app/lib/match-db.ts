import { normalizeStoredCandidate } from "./discover-candidate-db";
import { type CanonicalMatch } from "./match-model";

type MatchQueryResult = {
  data?: unknown[] | null;
  error?: unknown;
};

type MatchMutationResult = {
  error?: unknown;
};

type MatchSourceClient = {
  from(table: string): {
    select(columns: string): MatchQuery;
    upsert(
      value: Record<string, unknown>,
      options?: Record<string, unknown>
    ): PromiseLike<MatchMutationResult>;
    insert(value: Record<string, unknown>): PromiseLike<MatchMutationResult>;
    update(value: Record<string, unknown>): MatchQuery;
  };
};

type MatchQuery = {
  eq(column: string, value: string): MatchQuery;
  order(
    column: string,
    options: { ascending: boolean }
  ): MatchQuery;
} & PromiseLike<MatchQueryResult>;

export const MATCH_STATE_UPDATED_EVENT = "truekind:match-state-updated";

const LIKED_MATCHES_STORAGE_PREFIX = "truekind_liked_matches";

export type MatchSource = "matches" | "local" | "demo";

export type StoredMatchSourceResult = {
  source: MatchSource;
  matches: CanonicalMatch[];
  error: unknown | null;
};

function sortMatches(matches: CanonicalMatch[]) {
  return [...matches].sort((a, b) => {
    const updatedDifference =
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();

    if (Number.isFinite(updatedDifference) && updatedDifference !== 0) {
      return updatedDifference;
    }

    return a.name.localeCompare(b.name, "sv-SE");
  });
}

function getStoredLikedMatchesKey(userId?: string | null) {
  return `${LIKED_MATCHES_STORAGE_PREFIX}:${userId || "local"}`;
}

function dedupeMatches(matches: CanonicalMatch[]) {
  const byId = new Map<string, CanonicalMatch>();

  for (const match of matches) {
    if (!match.match_id) continue;
    byId.set(match.match_id, {
      ...byId.get(match.match_id),
      ...match,
      status: match.status || "active",
    });
  }

  return Array.from(byId.values());
}

function normalizeMatchForStorage(match: CanonicalMatch): CanonicalMatch {
  const now = new Date().toISOString();

  return {
    ...match,
    match_id: match.match_id.trim().toLowerCase(),
    target_profile_id: match.target_profile_id || match.match_id,
    latest_signal_text: match.latest_signal_text || "",
    latest_signal_at: match.latest_signal_at || "",
    unread_count: match.unread_count ?? 0,
    status: match.status || "active",
    created_at: match.created_at || now,
    updated_at: now,
  };
}

export function readStoredLikedMatches(userId?: string | null) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getStoredLikedMatchesKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => normalizeStoredCandidate(item))
      .filter((match): match is CanonicalMatch =>
        Boolean(match && match.status === "active")
      );
  } catch {
    return [];
  }
}

function writeStoredLikedMatches(
  userId: string | null | undefined,
  matches: CanonicalMatch[]
) {
  if (typeof window === "undefined") return;

  try {
    const normalized = sortMatches(dedupeMatches(matches).map(normalizeMatchForStorage));
    window.localStorage.setItem(
      getStoredLikedMatchesKey(userId),
      JSON.stringify(normalized)
    );
    window.dispatchEvent(new Event(MATCH_STATE_UPDATED_EVENT));
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

export function readStoredLikedMatchIds(userId?: string | null) {
  return new Set(readStoredLikedMatches(userId).map((match) => match.match_id));
}

export function storeLikedMatchLocally(
  userId: string | null | undefined,
  match: CanonicalMatch
) {
  const current = readStoredLikedMatches(userId);
  const next = dedupeMatches([...current, normalizeMatchForStorage(match)]);
  writeStoredLikedMatches(userId, next);
  return sortMatches(next);
}

function toMatchPayload(userId: string, match: CanonicalMatch) {
  const normalized = normalizeMatchForStorage(match);

  return {
    user_id: userId,
    match_id: normalized.match_id,
    target_profile_id: normalized.target_profile_id,
    name: normalized.name,
    age: normalized.age,
    city: normalized.city,
    image: normalized.image,
    chemistry_label: normalized.chemistry_label,
    about_text: normalized.about_text,
    looking_for: normalized.looking_for,
    activity_label: normalized.activity_label,
    interests: normalized.interests,
    latest_signal_text: normalized.latest_signal_text,
    latest_signal_at: normalized.latest_signal_at,
    unread_count: normalized.unread_count,
    status: normalized.status,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

export async function saveLikedMatch(
  client: unknown,
  userId: string,
  match: CanonicalMatch
) {
  const localMatches = storeLikedMatchLocally(userId, match);
  const matchClient = client as MatchSourceClient;
  const payload = toMatchPayload(userId, match);

  try {
    let result = await matchClient
      .from("matches")
      .upsert(payload, { onConflict: "user_id,match_id" });

    if (result.error) {
      result = await matchClient.from("matches").insert(payload);
    }

    return {
      ok: true,
      source: result.error ? ("local" as const) : ("matches" as const),
      matches: localMatches,
      error: result.error ?? null,
    };
  } catch (error) {
    return {
      ok: true,
      source: "local" as const,
      matches: localMatches,
      error,
    };
  }
}

export async function updateLikedMatchStatus(
  client: unknown,
  userId: string,
  match: CanonicalMatch,
  status: CanonicalMatch["status"]
) {
  const normalized = normalizeMatchForStorage({
    ...match,
    status,
  });
  const current = readStoredLikedMatches(userId).filter(
    (item) => item.match_id !== normalized.match_id
  );
  const next =
    status === "active" ? dedupeMatches([...current, normalized]) : current;

  writeStoredLikedMatches(userId, next);

  const matchClient = client as MatchSourceClient;

  try {
    let result = await matchClient
      .from("matches")
      .update({
        status,
        updated_at: normalized.updated_at,
      })
      .eq("user_id", userId)
      .eq("match_id", normalized.match_id);

    if (result.error) {
      result = await matchClient
        .from("matches")
        .upsert(toMatchPayload(userId, normalized), {
          onConflict: "user_id,match_id",
        });
    }

    return {
      ok: true,
      source: result.error ? ("local" as const) : ("matches" as const),
      matches: sortMatches(next),
      error: result.error ?? null,
    };
  } catch (error) {
    return {
      ok: true,
      source: "local" as const,
      matches: sortMatches(next),
      error,
    };
  }
}

async function queryUserMatches(
  client: MatchSourceClient,
  userId: string,
  options: { includeStatusFilter: boolean; includeUpdatedOrder: boolean }
) {
  let query = client.from("matches").select("*").eq("user_id", userId);

  if (options.includeStatusFilter) {
    query = query.eq("status", "active");
  }

  if (options.includeUpdatedOrder) {
    query = query.order("updated_at", { ascending: false });
  }

  return query;
}

async function loadUserMatches(
  client: unknown,
  userId: string
): Promise<StoredMatchSourceResult> {
  const matchClient = client as MatchSourceClient;

  try {
    let result = await queryUserMatches(matchClient, userId, {
      includeStatusFilter: true,
      includeUpdatedOrder: true,
    });

    if (result.error) {
      result = await queryUserMatches(matchClient, userId, {
        includeStatusFilter: false,
        includeUpdatedOrder: false,
      });
    }

    const localMatches = readStoredLikedMatches(userId);

    if (result.error) {
      if (localMatches.length) {
        return {
          source: "local",
          matches: sortMatches(localMatches),
          error: result.error,
        };
      }

      return {
        source: "demo",
        matches: [],
        error: result.error,
      };
    }

    const matches = (result.data ?? [])
      .map((row) => normalizeStoredCandidate(row))
      .filter((match): match is CanonicalMatch => Boolean(match));

    if (matches.length) {
      return {
        source: "matches",
        matches: sortMatches(dedupeMatches(matches)),
        error: null,
      };
    }

    if (localMatches.length) {
      return {
        source: "local",
        matches: sortMatches(localMatches),
        error: null,
      };
    }

    return {
      source: "matches",
      matches: [],
      error: null,
    };
  } catch (error) {
    const localMatches = readStoredLikedMatches(userId);

    if (localMatches.length) {
      return {
        source: "local",
        matches: sortMatches(localMatches),
        error,
      };
    }

    return {
      source: "demo",
      matches: [],
      error,
    };
  }
}

export async function loadStoredMatchSource(
  client: unknown,
  userId?: string | null
): Promise<StoredMatchSourceResult> {
  if (userId) {
    return loadUserMatches(client, userId);
  }

  return {
    source: "demo",
    matches: [],
    error: null,
  };
}
