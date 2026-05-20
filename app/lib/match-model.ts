import type { ProfileUiFields } from "./profile-model";

export type MatchStatus = "active" | "archived" | "hidden";

export const MATCH_STATUS = {
  active: "active",
  hidden: "hidden",
  archived: "archived",
} as const satisfies Record<MatchStatus, MatchStatus>;

export function normalizeMatchStatus(value: unknown): MatchStatus {
  return value === MATCH_STATUS.archived || value === MATCH_STATUS.hidden
    ? value
    : MATCH_STATUS.active;
}

export function isVisibleMatchStatus(value: unknown) {
  return normalizeMatchStatus(value) === MATCH_STATUS.active;
}

export function isVisibleMatch(match: Pick<CanonicalMatch, "status">) {
  return isVisibleMatchStatus(match.status);
}

export type CanonicalMatch = {
  match_id: string;
  target_profile_id: string;
  name: string;
  age: number;
  city: string;
  image: string;
  chemistry_label: string;
  about_text: string;
  looking_for: string;
  activity_label: string;
  interests: string[];
  latest_signal_text: string;
  latest_signal_at: string;
  unread_count: number;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
};

export type MatchSignal = {
  match_id: string;
  latest_signal_text: string;
  latest_signal_at: string;
  unread_count: number;
  has_unread: boolean;
  last_read_at: string | null;
};

export type ConversationSignalSource = {
  id: string;
  latest_message_text: string;
  latest_message_at: string;
  unread_count: number;
  has_unread: boolean;
  last_read_at: string | null;
};

export type MatchView = CanonicalMatch & {
  conversation_id: string;
  latest_message_text: string;
  latest_message_at: string;
  preview_text: string;
  preview_source: "message" | "fallback";
  activity_at: string;
  has_latest_message: boolean;
  has_unread: boolean;
  last_read_at: string | null;
};

export type DiscoverCandidate = MatchView & {
  candidate_id: string;
  source: "backend" | "demo";
  bio: string;
  profile_prompt: string;
  relevance_label: string;
};

const DEMO_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const DEMO_MATCHES: CanonicalMatch[] = [
  {
    match_id: "anna",
    target_profile_id: "demo-profile-anna",
    name: "Anna",
    age: 34,
    city: "Malmö",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    chemistry_label: "Varm, jordnära, nyfiken",
    about_text:
      "Tycker om djupa samtal, tydlig energi och människor som känns äkta direkt.",
    looking_for: "Djupare kontakt",
    activity_label: "Konsert",
    interests: ["samtal", "musik", "närvaro"],
    latest_signal_text: "",
    latest_signal_at: "",
    unread_count: 0,
    status: "active",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    match_id: "sara",
    target_profile_id: "demo-profile-sara",
    name: "Sara",
    age: 29,
    city: "Lund",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
    chemistry_label: "Lättsam, skarp, social",
    about_text:
      "Gillar humor, snabb kemi och människor som både kan vara lätta och seriösa.",
    looking_for: "Någon att lära känna",
    activity_label: "Virtuell kaffe",
    interests: ["kaffe", "humor", "spontant"],
    latest_signal_text: "",
    latest_signal_at: "",
    unread_count: 0,
    status: "active",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    match_id: "elin",
    target_profile_id: "demo-profile-elin",
    name: "Elin",
    age: 37,
    city: "Helsingborg",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    chemistry_label: "Eftertänksam, varm, kulturell",
    about_text:
      "Trivs bäst i samtal med djup, kultur, musik och människor som vågar vara mjuka.",
    looking_for: "Långvarig relation",
    activity_label: "Bokprat",
    interests: ["böcker", "konserter", "kultur"],
    latest_signal_text: "",
    latest_signal_at: "",
    unread_count: 0,
    status: "active",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
];

export function normalizeMatchId(value: string | null | undefined) {
  const matchId = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9_-]+$/.test(matchId) ? matchId : null;
}

export function applySignalsToMatches(
  signals: MatchSignal[],
  matches: CanonicalMatch[] = DEMO_MATCHES
) {
  return matches.map((match) => {
    const signal = signals.find((item) => item.match_id === match.match_id);

    return {
      ...match,
      latest_signal_text:
        signal?.latest_signal_text ?? match.latest_signal_text,
      latest_signal_at: signal?.latest_signal_at ?? match.latest_signal_at,
      unread_count: signal?.unread_count ?? match.unread_count,
      updated_at: signal?.latest_signal_at || match.updated_at,
    };
  });
}

export function buildMatchSignals(
  conversations: ConversationSignalSource[]
): MatchSignal[] {
  return conversations.map((conversation) => ({
    match_id: conversation.id,
    latest_signal_text: conversation.latest_message_text,
    latest_signal_at: conversation.latest_message_at,
    unread_count: conversation.unread_count,
    has_unread: conversation.has_unread,
    last_read_at: conversation.last_read_at,
  }));
}

function getActivityTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function buildMatchViews(
  signals: MatchSignal[],
  matches: CanonicalMatch[] = DEMO_MATCHES
): MatchView[] {
  const signalsByMatch = new Map(
    signals.map((signal) => [signal.match_id, signal])
  );

  return applySignalsToMatches(signals, matches)
    .map((match) => {
      const signal = signalsByMatch.get(match.match_id);
      const hasLatestMessage = Boolean(
        match.latest_signal_text && match.latest_signal_at
      );

      return {
        ...match,
        conversation_id: match.match_id,
        latest_message_text: match.latest_signal_text,
        latest_message_at: match.latest_signal_at,
        preview_text: match.latest_signal_text || match.about_text,
        preview_source: hasLatestMessage
          ? ("message" as const)
          : ("fallback" as const),
        activity_at: match.latest_signal_at || match.updated_at,
        has_latest_message: hasLatestMessage,
        has_unread: signal?.has_unread ?? match.unread_count > 0,
        last_read_at: signal?.last_read_at ?? null,
      };
    })
    .sort((a, b) => {
      const activityDifference =
        getActivityTime(b.activity_at) - getActivityTime(a.activity_at);

      if (activityDifference !== 0) return activityDifference;
      return a.name.localeCompare(b.name, "sv-SE");
    });
}

export function buildMatchViewsFromConversations(
  conversations: ConversationSignalSource[] = []
): MatchView[] {
  return buildMatchViews(buildMatchSignals(conversations));
}

export function buildMatchViewsFromSource(
  matches: CanonicalMatch[] = DEMO_MATCHES,
  conversations: ConversationSignalSource[] = []
): MatchView[] {
  return buildMatchViews(buildMatchSignals(conversations), matches);
}

function normalizeText(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getCandidateScore(
  candidate: CanonicalMatch,
  profile: ProfileUiFields | null | undefined
) {
  if (!profile) return 0;

  const profileCity = normalizeText(profile.city);
  const profileIntent = normalizeText(
    profile.lookingFor || profile.contactIntent
  );
  const profileActivity = normalizeText(profile.activityInterest);
  const profileInterests = new Set(
    (profile.interests ?? []).map((item) => normalizeText(item)).filter(Boolean)
  );

  let score = 0;

  if (profileCity && normalizeText(candidate.city) === profileCity) {
    score += 3;
  }

  if (
    profileIntent &&
    normalizeText(candidate.looking_for).includes(profileIntent)
  ) {
    score += 2;
  }

  if (
    profileActivity &&
    normalizeText(candidate.activity_label).includes(profileActivity)
  ) {
    score += 2;
  }

  for (const interest of candidate.interests) {
    if (profileInterests.has(normalizeText(interest))) {
      score += 1;
    }
  }

  return score;
}

function getRelevanceLabel(score: number) {
  if (score >= 3) return "Matchar din profil";
  if (score > 0) return "Delar några signaler";
  return "Utforska i lugn takt";
}

export function buildDiscoverCandidates(
  profile?: ProfileUiFields | null,
  signals: MatchSignal[] = [],
  matches: CanonicalMatch[] = DEMO_MATCHES,
  source: DiscoverCandidate["source"] = "demo"
): DiscoverCandidate[] {
  return buildMatchViews(signals, matches).map((match) => {
    const score = getCandidateScore(match, profile);

    return {
      ...match,
      candidate_id: match.target_profile_id,
      source,
      bio: match.about_text,
      profile_prompt: match.preview_text,
      relevance_label: getRelevanceLabel(score),
    };
  }).sort((a, b) => {
    const scoreDifference =
      getCandidateScore(b, profile) - getCandidateScore(a, profile);

    if (scoreDifference !== 0) return scoreDifference;
    const activityDifference =
      getActivityTime(b.activity_at) - getActivityTime(a.activity_at);

    if (activityDifference !== 0) return activityDifference;
    return a.name.localeCompare(b.name, "sv-SE");
  });
}

export function buildDiscoverCandidateViews(
  profile: ProfileUiFields | null | undefined,
  conversations: ConversationSignalSource[] = [],
  matches: CanonicalMatch[] = DEMO_MATCHES,
  source: DiscoverCandidate["source"] = "demo"
): DiscoverCandidate[] {
  return buildDiscoverCandidates(
    profile,
    buildMatchSignals(conversations),
    matches,
    source
  );
}
