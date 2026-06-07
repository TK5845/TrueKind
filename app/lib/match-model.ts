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

export type MatchInsight = {
  id: "feeling" | "starting-point" | "continuity";
  label: string;
  text: string;
};

export type FirstMessageGuide = {
  insight: string;
  suggestions: string[];
};

export type ConversationContinuationGuide = {
  insight: string;
  suggestions: string[];
};

type MatchInsightSource = {
  name?: string;
  chemistry_label?: string;
  about_text?: string;
  looking_for?: string;
  activity_label?: string;
  interests?: string[];
  latest_message_text?: string;
  latest_signal_text?: string;
};

type DiscoverCardContextProfile =
  | Pick<
      ProfileUiFields,
      "interests" | "lookingFor" | "contactIntent"
    >
  | null
  | undefined;

type DiscoverCardContextSource = Pick<
  MatchInsightSource,
  "interests" | "activity_label" | "chemistry_label" | "looking_for" | "about_text"
>;

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

function cleanInsightText(value: string | undefined) {
  return value?.trim() ?? "";
}

function sentence(value: string) {
  const text = value.trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function formatInsightList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} och ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`;
}

function uniqueTextItems(items: string[]) {
  const seen = new Set<string>();
  const uniqueItems: string[] = [];

  for (const item of items) {
    const text = item.trim();
    const key = normalizeText(text);

    if (!text || seen.has(key)) continue;
    seen.add(key);
    uniqueItems.push(text);
  }

  return uniqueItems;
}

function formatLowercaseList(items: string[]) {
  return formatInsightList(items.map((item) => item.toLowerCase()));
}

export function buildDiscoverCardContext(
  profile: DiscoverCardContextProfile,
  candidate: DiscoverCardContextSource
) {
  const profileInterests = new Set(
    (profile?.interests ?? []).map((item) => normalizeText(item)).filter(Boolean)
  );
  const candidateInterests = uniqueTextItems(candidate.interests ?? []).slice(0, 3);
  const sharedInterests = candidateInterests.filter((item) =>
    profileInterests.has(normalizeText(item))
  );
  const activity = cleanInsightText(candidate.activity_label);
  const chemistryWords = uniqueTextItems(
    cleanInsightText(candidate.chemistry_label)
      .split(",")
      .map((item) => item.trim())
  ).slice(0, 2);
  const lookingFor = cleanInsightText(candidate.looking_for);
  const profileDirection = normalizeText(
    profile?.lookingFor || profile?.contactIntent
  );
  const about = cleanInsightText(candidate.about_text);

  if (sharedInterests.length) {
    return `Gemensam ingång: ${formatLowercaseList(sharedInterests.slice(0, 2))}`;
  }

  if (candidateInterests.length) {
    return `Bra startpunkt: fråga om ${candidateInterests[0].toLowerCase()}`;
  }

  if (activity) {
    return `Bra startpunkt: fråga om ${activity.toLowerCase()}`;
  }

  if (chemistryWords.length) {
    return `Passar din ton: ${formatLowercaseList(chemistryWords)}`;
  }

  if (lookingFor) {
    return profileDirection && normalizeText(lookingFor).includes(profileDirection)
      ? "Söker något som liknar din riktning"
      : `Söker: ${lookingFor.toLowerCase()}`;
  }

  if (about) {
    return "Profilen ger en personlig öppning";
  }

  return "En mjuk profil att utforska vidare";
}

export function buildFirstMessageGuide(
  match: Pick<
    MatchInsightSource,
    "name" | "interests" | "activity_label" | "chemistry_label" | "about_text"
  >
): FirstMessageGuide {
  const name = cleanInsightText(match.name) || "matchningen";
  const interests = uniqueTextItems(match.interests ?? []).slice(0, 3);
  const activity = cleanInsightText(match.activity_label);
  const chemistryWords = uniqueTextItems(
    cleanInsightText(match.chemistry_label)
      .split(",")
      .map((item) => item.trim())
  ).slice(0, 2);
  const about = cleanInsightText(match.about_text);

  const insightAnchor = interests.length
    ? `${name} har redan en naturlig startpunkt i ${formatInsightList(
        interests.slice(0, 2)
      )}.`
    : activity
      ? `${name} verkar ha en enkel öppning kring ${activity.toLowerCase()}.`
      : about
        ? `${name}s profil ger en personlig öppning utan att du behöver skriva långt.`
        : `Du kan börja enkelt och personligt med ${name}.`;
  const toneHint = chemistryWords.length
    ? ` Håll tonen ${formatLowercaseList(chemistryWords)}.`
    : "";
  const primaryInterest = interests[0];
  const secondaryInterest = interests[1];
  const interestPair =
    primaryInterest && secondaryInterest
      ? formatInsightList([primaryInterest, secondaryInterest])
      : primaryInterest;

  const suggestions = uniqueTextItems([
    primaryInterest
      ? `Hej ${name}, jag fastnade för ${primaryInterest.toLowerCase()}. Vad brukar göra det extra fint för dig?`
      : "",
    interestPair && secondaryInterest
      ? `Hej ${name}, jag såg ${interestPair.toLowerCase()} i din profil. Vilken av dem känns mest levande för dig just nu?`
      : "",
    activity
      ? `Hej ${name}, ${activity.toLowerCase()} låter som en fin startpunkt. Vad gillar du mest med det?`
      : "",
    chemistryWords.length
      ? `Hej ${name}, din profil känns ${formatLowercaseList(
          chemistryWords
        )}. Jag blev nyfiken på vad som ger dig den känslan just nu.`
      : "",
    about
      ? `Hej ${name}, jag fastnade för hur du beskriver dig. Vad känns viktigast för dig i en första kontakt?`
      : "",
    `Hej ${name}, jag blev nyfiken på din profil. Hur ser en riktigt bra första pratstund ut för dig?`,
    `Hej ${name}, vill du börja enkelt? Vad har varit fint i din dag hittills?`,
  ]).slice(0, 3);

  return {
    insight: `${insightAnchor}${toneHint}`.trim(),
    suggestions,
  };
}

export function buildConversationContinuationGuide(input: {
  name?: string;
  chemistry_label?: string;
  interests?: string[];
  activity_label?: string;
  latest_message_text?: string;
  latest_message_sender?: "me" | "them";
  has_unread?: boolean;
}): ConversationContinuationGuide {
  const name = cleanInsightText(input.name) || "matchningen";
  const latestMessage = cleanInsightText(input.latest_message_text);
  const latestSender = input.latest_message_sender === "me" ? "me" : "them";
  const interests = uniqueTextItems(input.interests ?? []).slice(0, 2);
  const activity = cleanInsightText(input.activity_label);
  const chemistryWords = uniqueTextItems(
    cleanInsightText(input.chemistry_label)
      .split(",")
      .map((item) => item.trim())
  ).slice(0, 2);
  const primaryInterest = interests[0];
  const secondaryInterest = interests[1];
  const lowercaseActivity = activity.toLowerCase();
  const sharedAnchor = interests.length
    ? `Ni har fortfarande en naturlig tråd i ${formatInsightList(interests)}.`
    : activity
      ? `${activity} kan vara en mjuk fortsättning om samtalet behöver ny riktning.`
      : chemistryWords.length
        ? `Låt svaret behålla känslan ${formatLowercaseList(chemistryWords)}.`
        : "Fortsätt enkelt och närvarande utan att göra svaret för stort.";
  const latestReplyAnchor = primaryInterest
    ? `det ${name} skrev och ${primaryInterest.toLowerCase()}`
    : activity
      ? `det ${name} skrev och ${lowercaseActivity}`
      : chemistryWords.length
        ? `det ${name} skrev med en ${formatLowercaseList(chemistryWords)} ton`
        : `det ${name} skrev`;
  const myReplyAnchor = primaryInterest
    ? `det jag skrev, särskilt kring ${primaryInterest.toLowerCase()}`
    : activity
      ? `det jag skrev och ${lowercaseActivity}`
      : chemistryWords.length
        ? `det jag skrev, med samma ${formatLowercaseList(chemistryWords)} känsla`
        : "det jag skrev";

  if (latestSender === "me") {
    return {
      insight: `${name} har ditt senaste svar. ${sharedAnchor}`,
      suggestions: uniqueTextItems([
        latestMessage
          ? `Jag blev nyfiken på hur du tänker om ${myReplyAnchor}.`
          : `Jag blev nyfiken på hur du tänker vidare här.`,
        secondaryInterest
          ? `Och apropå ${secondaryInterest.toLowerCase()}, vad brukar kännas mest levande för dig där?`
          : primaryInterest
            ? `Vad skulle du vilja fortsätta upptäcka kring ${primaryInterest.toLowerCase()}?`
            : activity
              ? `Skulle ${lowercaseActivity} kännas som en fin fortsättning för dig?`
              : chemistryWords.length
                ? `Vad skulle göra samtalet ${formatLowercaseList(
                    chemistryWords
                  )} för dig?`
                : `Vad skulle du vilja fortsätta prata om härifrån?`,
      ]).slice(0, 2),
    };
  }

  return {
    insight: input.has_unread
      ? `${name} har skrivit. Svara gärna på det senaste först. ${sharedAnchor}`
      : `${name}s senaste meddelande ger en naturlig öppning. ${sharedAnchor}`,
    suggestions: uniqueTextItems([
      latestMessage
        ? `Jag fastnade för ${latestReplyAnchor}. Berätta gärna lite mer.`
        : "",
      activity
        ? `Det du skrev får mig att tänka på ${lowercaseActivity}. Vad skulle kännas enkelt för dig där?`
        : "",
      chemistryWords.length
        ? `Det låter ${formatLowercaseList(
            chemistryWords
          )}. Jag vill gärna förstå mer om det du menar.`
        : "",
      primaryInterest
        ? `Det får mig att tänka på ${primaryInterest.toLowerCase()}. Hur är det för dig?`
        : `Hur känns det för dig just nu?`,
    ]).slice(0, 2),
  };
}

export function buildMatchInsights(match: MatchInsightSource): MatchInsight[] {
  const name = cleanInsightText(match.name) || "Matchningen";
  const chemistry = cleanInsightText(match.chemistry_label);
  const about = cleanInsightText(match.about_text);
  const lookingFor = cleanInsightText(match.looking_for);
  const activity = cleanInsightText(match.activity_label);
  const interests = uniqueTextItems(match.interests ?? []).slice(0, 3);
  const latestSignal = cleanInsightText(
    match.latest_message_text || match.latest_signal_text
  );
  const insights: MatchInsight[] = [];

  if (interests.length || activity || lookingFor || about) {
    const startingPoints = [
      interests.length
        ? `Ni har redan konkreta gemensamma spår i ${formatInsightList(interests)}`
        : "",
      activity
        ? interests.length
          ? `${activity} kan bli en enkel väg in i samtalet`
          : `Börja i ${activity.toLowerCase()}, eftersom det ger något konkret att fråga om`
        : "",
      lookingFor
        ? `${name} söker ${lookingFor.toLowerCase()}, så låt öppningen ligga nära det`
        : "",
      about && !interests.length && !activity
        ? `Profiltexten ger en personlig krok: ${sentence(about)}`
        : "",
    ];

    insights.push({
      id: "starting-point",
      label: "Bra startpunkt",
      text: uniqueTextItems(startingPoints).map(sentence).join(" "),
    });
  }

  if (chemistry || (about && (interests.length || activity))) {
    insights.push({
      id: "feeling",
      label: "Känslan",
      text: [
        chemistry ? `Känslan i profilen: ${sentence(chemistry)}` : "",
        about && (interests.length || activity)
          ? `Det syns också i profilen: ${sentence(about)}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  const nextStep = interests[0]
    ? `Nästa steg kan vara att plocka upp ${interests[0].toLowerCase()} med en konkret fråga.`
    : activity
      ? `Nästa steg kan vara att göra ${activity.toLowerCase()} enkelt: fråga vad som skulle kännas lätt att börja med.`
      : chemistry
        ? `Nästa steg kan vara att hålla tonen nära ${chemistry.toLowerCase()} och fråga något personligt men lätt.`
        : lookingFor
          ? `Nästa steg kan vara att fråga vad ${lookingFor.toLowerCase()} betyder i praktiken för ${name}.`
          : about
            ? "Nästa steg kan vara att plocka upp något från profiltexten och fråga vidare där."
            : "Det finns inget samtal ännu, så första steget kan vara enkelt, varmt och personligt.";

  insights.push({
    id: "continuity",
    label: "Nästa steg",
    text: latestSignal
      ? `Senaste signalen ger er en naturlig fortsättning. Plocka upp: "${latestSignal}"`
      : nextStep,
  });

  return insights.slice(0, 3);
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
