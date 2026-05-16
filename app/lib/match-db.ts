import {
  loadStoredDiscoverCandidates,
  normalizeStoredCandidate,
} from "./discover-candidate-db";
import { DEMO_MATCHES, type CanonicalMatch } from "./match-model";

type MatchQueryResult = {
  data?: unknown[] | null;
  error?: unknown;
};

type MatchSourceClient = {
  from(table: string): {
    select(columns: string): MatchQuery;
  };
};

type MatchQuery = {
  eq(column: string, value: string): MatchQuery;
  order(
    column: string,
    options: { ascending: boolean }
  ): MatchQuery;
} & PromiseLike<MatchQueryResult>;

export type MatchSource = "matches" | "discover" | "demo";

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

    if (result.error) {
      return {
        source: "demo",
        matches: [],
        error: result.error,
      };
    }

    const matches = (result.data ?? [])
      .map((row) => normalizeStoredCandidate(row))
      .filter((match): match is CanonicalMatch => Boolean(match));

    return {
      source: "matches",
      matches: sortMatches(matches),
      error: null,
    };
  } catch (error) {
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
    const matchResult = await loadUserMatches(client, userId);

    if (matchResult.source === "matches") {
      return matchResult;
    }
  }

  const discoverResult = await loadStoredDiscoverCandidates(client, userId);

  if (discoverResult.source === "backend") {
    return {
      source: "discover",
      matches: discoverResult.candidates,
      error: null,
    };
  }

  return {
    source: "demo",
    matches: DEMO_MATCHES,
    error: discoverResult.error,
  };
}
