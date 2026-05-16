import { DEMO_MATCHES, normalizeMatchId } from "./match-model";

export const MESSAGE_SELECT_COLUMNS =
  "id,match_id,sender,message_text,sent_at,read_at,is_read";
export const MESSAGE_MINIMUM_SELECT_COLUMNS =
  "id,match_id,sender,message_text,sent_at";
export const MESSAGE_READ_STATE_UPDATED_EVENT = "truekind:message-read-state";

export type MessageSender = "me" | "them";

export type Message = {
  id: string;
  match_id: string;
  sender: MessageSender;
  message_text: string;
  sent_at: string;
  read_at: string | null;
  is_read: boolean;
};

export type MessageRow = {
  id?: unknown;
  match_id?: unknown;
  sender?: unknown;
  message_text?: unknown;
  sent_at?: unknown;
  read_at?: unknown;
  is_read?: unknown;
};

export type ConversationProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  image: string;
  chemistry: string;
};

export type ConversationPreview = ConversationProfile & {
  latest_message_text: string;
  latest_message_at: string;
  last_read_at: string | null;
  unread_count: number;
  unread_message_ids: string[];
  has_unread: boolean;
};

export type ConversationView = ConversationPreview & {
  messages: Message[];
};

function conversationProfilesFromMatches(matches = DEMO_MATCHES) {
  return matches.map((match) => ({
    id: match.match_id,
    name: match.name,
    age: match.age,
    city: match.city,
    image: match.image,
    chemistry: match.chemistry_label,
  }));
}

export const BASE_MESSAGES: Message[] = [
  {
    id: "a1",
    match_id: "anna",
    sender: "them",
    message_text: "Hej! Jag såg att du gillar djupa samtal.",
    sent_at: "2026-01-10T09:18:00.000Z",
    read_at: "2026-01-10T09:18:00.000Z",
    is_read: true,
  },
  {
    id: "a2",
    match_id: "anna",
    sender: "me",
    message_text: "Ja, absolut. Hellre äkta än bara småprat.",
    sent_at: "2026-01-10T09:24:00.000Z",
    read_at: "2026-01-10T09:24:00.000Z",
    is_read: true,
  },
  {
    id: "a3",
    match_id: "anna",
    sender: "them",
    message_text: "Samma här. Hur ser en riktigt bra kväll ut för dig?",
    sent_at: "2026-01-10T09:31:00.000Z",
    read_at: "2026-01-10T09:31:00.000Z",
    is_read: true,
  },
  {
    id: "a4",
    match_id: "anna",
    sender: "me",
    message_text:
      "Bra energi, lugn stämning och någon som faktiskt vill prata på riktigt.",
    sent_at: "2026-01-10T09:37:00.000Z",
    read_at: "2026-01-10T09:37:00.000Z",
    is_read: true,
  },
  {
    id: "a5",
    match_id: "anna",
    sender: "them",
    message_text: "Det där lät faktiskt som en riktigt bra idé.",
    sent_at: "2026-01-10T09:42:00.000Z",
    read_at: "2026-01-10T09:42:00.000Z",
    is_read: true,
  },
  {
    id: "s1",
    match_id: "sara",
    sender: "them",
    message_text: "Du verkar ha en lugn energi.",
    sent_at: "2026-01-09T18:02:00.000Z",
    read_at: "2026-01-09T18:02:00.000Z",
    is_read: true,
  },
  {
    id: "s2",
    match_id: "sara",
    sender: "me",
    message_text: "Tack, det tar jag som en komplimang.",
    sent_at: "2026-01-09T18:06:00.000Z",
    read_at: "2026-01-09T18:06:00.000Z",
    is_read: true,
  },
  {
    id: "s3",
    match_id: "sara",
    sender: "them",
    message_text: "Jag hade gärna tagit den där virtuella kaffen.",
    sent_at: "2026-01-09T18:11:00.000Z",
    read_at: "2026-01-09T18:11:00.000Z",
    is_read: true,
  },
  {
    id: "e1",
    match_id: "elin",
    sender: "them",
    message_text: "Jag såg att du också gillar konserter.",
    sent_at: "2026-01-05T14:07:00.000Z",
    read_at: "2026-01-05T14:07:00.000Z",
    is_read: true,
  },
  {
    id: "e2",
    match_id: "elin",
    sender: "me",
    message_text: "Ja, gärna live. Det blir en helt annan känsla.",
    sent_at: "2026-01-05T14:15:00.000Z",
    read_at: "2026-01-05T14:15:00.000Z",
    is_read: true,
  },
  {
    id: "e3",
    match_id: "elin",
    sender: "them",
    message_text: "Vi verkar faktiskt gilla ganska lika saker.",
    sent_at: "2026-01-05T14:22:00.000Z",
    read_at: "2026-01-05T14:22:00.000Z",
    is_read: true,
  },
];

export function getTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeSender(value: unknown): MessageSender {
  return value === "them" ? "them" : "me";
}

function normalizeReadState(input: {
  sender: MessageSender;
  readAt: string | null;
  isRead: unknown;
  hasReadAtField: boolean;
  hasIsReadField: boolean;
}) {
  if (!input.hasReadAtField && !input.hasIsReadField) {
    return true;
  }

  if (typeof input.isRead === "boolean") return input.isRead;
  if (input.readAt) return true;

  return input.sender === "me";
}

export function normalizeMessage(row: MessageRow): Message | null {
  const matchId =
    typeof row.match_id === "string" ? normalizeMatchId(row.match_id) : null;
  const text = typeof row.message_text === "string" ? row.message_text : "";
  const sentAt = typeof row.sent_at === "string" ? row.sent_at : "";

  if (!matchId || !text || !sentAt) return null;

  const sender = normalizeSender(row.sender);
  const hasReadAtField = Object.prototype.hasOwnProperty.call(row, "read_at");
  const hasIsReadField = Object.prototype.hasOwnProperty.call(row, "is_read");
  const readAt = typeof row.read_at === "string" ? row.read_at : null;

  return {
    id: typeof row.id === "string" ? row.id : `${matchId}-${sentAt}`,
    match_id: matchId,
    sender,
    message_text: text,
    sent_at: sentAt,
    read_at: readAt,
    is_read: normalizeReadState({
      sender,
      readAt,
      isRead: row.is_read,
      hasReadAtField,
      hasIsReadField,
    }),
  };
}

export function getLatestMessage(messages: Message[]) {
  return messages.reduce<Message | null>((latest, message) => {
    if (!latest) return message;
    return getTime(message.sent_at) > getTime(latest.sent_at) ? message : latest;
  }, null);
}

export function isUnreadForCurrentUser(message: Message) {
  return message.sender === "them" && !message.is_read;
}

export function getLastReadAt(messages: Message[]) {
  return messages.reduce<string | null>((latestReadAt, message) => {
    if (message.sender !== "them" || !message.read_at) return latestReadAt;

    return getTime(message.read_at) > getTime(latestReadAt ?? "")
      ? message.read_at
      : latestReadAt;
  }, null);
}

export function getConversationReadState(messages: Message[]) {
  const unreadMessages = messages.filter(isUnreadForCurrentUser);

  return {
    last_read_at: getLastReadAt(messages),
    unread_count: unreadMessages.length,
    unread_message_ids: unreadMessages.map((message) => message.id),
    has_unread: unreadMessages.length > 0,
  };
}

export function getUnreadSummary(conversations: ConversationPreview[]) {
  return conversations.reduce(
    (summary, conversation) => ({
      total_unread_count:
        summary.total_unread_count + conversation.unread_count,
      unread_conversation_count:
        summary.unread_conversation_count + (conversation.has_unread ? 1 : 0),
    }),
    {
      total_unread_count: 0,
      unread_conversation_count: 0,
    }
  );
}

export function formatUnreadCount(count: number) {
  if (count <= 0) return "";
  return count === 1 ? "1 oläst" : `${count} olästa`;
}

function buildConversationView(
  profile: ConversationProfile,
  messages: Message[]
): ConversationView {
  const sortedMessages = [...messages].sort(
    (a, b) => getTime(a.sent_at) - getTime(b.sent_at)
  );
  const latest = getLatestMessage(sortedMessages);
  const readState = getConversationReadState(sortedMessages);

  return {
    ...profile,
    latest_message_text: latest?.message_text ?? "",
    latest_message_at: latest?.sent_at ?? "",
    ...readState,
    messages: sortedMessages,
  };
}

function sortConversationViews(conversations: ConversationView[]) {
  return [...conversations].sort(
    (a, b) => getTime(b.latest_message_at) - getTime(a.latest_message_at)
  );
}

export function buildConversationViews(
  rows: MessageRow[],
  matches = DEMO_MATCHES,
  options: { includeSeedMessages?: boolean } = {}
): ConversationView[] {
  const grouped = new Map<string, Message[]>();
  const dbMessages = rows
    .map((row) => normalizeMessage(row))
    .filter((message): message is Message => Boolean(message));
  const includeSeedMessages =
    options.includeSeedMessages ?? matches === DEMO_MATCHES;
  const seedMessages = includeSeedMessages ? BASE_MESSAGES : [];

  for (const message of [...seedMessages, ...dbMessages]) {
    const messages = grouped.get(message.match_id) ?? [];
    messages.push(message);
    grouped.set(message.match_id, messages);
  }

  return sortConversationViews(
    conversationProfilesFromMatches(matches).map((profile) =>
      buildConversationView(profile, grouped.get(profile.id) ?? [])
    )
  );
}

export function getConversationPreview(
  conversations: ConversationView[],
  id: string
) {
  return conversations.find((conversation) => conversation.id === id) ?? null;
}

export function appendMessageToConversationViews(
  conversations: ConversationView[],
  row: MessageRow,
  matches = DEMO_MATCHES
) {
  const message = normalizeMessage(row);
  if (!message) return conversations;

  let foundConversation = false;
  const nextConversations = conversations.map((conversation) => {
    if (conversation.id !== message.match_id) return conversation;

    foundConversation = true;
    return buildConversationView(conversation, [
      ...conversation.messages.filter((item) => item.id !== message.id),
      message,
    ]);
  });

  if (!foundConversation) {
    const profile = conversationProfilesFromMatches(matches).find(
      (item) => item.id === message.match_id
    );

    if (!profile) return conversations;
    nextConversations.push(buildConversationView(profile, [message]));
  }

  return sortConversationViews(nextConversations);
}

export function markConversationReadInViews(
  conversations: ConversationView[],
  matchId: string,
  readAt: string
) {
  return sortConversationViews(
    conversations.map((conversation) => {
      if (conversation.id !== matchId || !conversation.has_unread) {
        return conversation;
      }

      return buildConversationView(
        conversation,
        conversation.messages.map((message) =>
          message.sender === "them" && !message.is_read
            ? {
                ...message,
                read_at: message.read_at ?? readAt,
                is_read: true,
              }
            : message
        )
      );
    })
  );
}
