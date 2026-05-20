import {
  MESSAGE_MINIMUM_SELECT_COLUMNS,
  MESSAGE_SELECT_COLUMNS,
  buildConversationViews,
  getUnreadSummary,
  getUnreadSummaryFromMessages,
  getUnreadSummaryFromRows,
  normalizeMessage,
  type ConversationView,
  type Message,
  type MessageRow,
} from "./message-model";
import type { DataSourceReason, SourceState } from "./data-source";
import { DEMO_MATCHES, type CanonicalMatch } from "./match-model";

type MessageQueryResult = {
  data?: MessageRow[] | null;
  error?: unknown;
};

type MessageMutationResult = {
  error?: unknown;
};

type MessagePreviewClient = {
  from(table: string): {
    select(columns: string): MessagePreviewQuery;
    update(values: Record<string, unknown>): MessageReadUpdateQuery;
  };
};

type MessagePreviewQuery = {
  eq(column: string, value: string): MessagePreviewQuery;
  order(
    column: string,
    options: { ascending: boolean }
  ): PromiseLike<MessageQueryResult>;
};

type MessageReadUpdateQuery = {
  eq(column: string, value: string): MessageReadUpdateQuery;
  then<TResult1 = MessageMutationResult, TResult2 = never>(
    onfulfilled?:
      | ((value: MessageMutationResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};

export type ConversationSource = "messages" | "seed" | "empty" | "fallback";

export type ConversationSourceResult = SourceState<ConversationSource> & {
  conversations: ConversationView[];
  usedMinimumColumns: boolean;
};

function conversationSourceResult(input: {
  source: ConversationSource;
  conversations: ConversationView[];
  reason: DataSourceReason;
  usedMinimumColumns?: boolean;
  error?: unknown;
}): ConversationSourceResult {
  return {
    source: input.source,
    conversations: input.conversations,
    reason: input.reason,
    usedMinimumColumns: input.usedMinimumColumns ?? false,
    isFallback: input.source === "seed" || input.source === "fallback",
    error: input.error ?? null,
  };
}

export function getDefaultConversationViews(
  matches: CanonicalMatch[] = DEMO_MATCHES,
  options: { includeSeedMessages?: boolean } = {}
): ConversationView[] {
  return buildConversationViews([], matches, options);
}

export function conversationViewsFromMessageResult(
  result: MessageQueryResult | null | undefined,
  matches: CanonicalMatch[] = DEMO_MATCHES,
  options: { includeSeedMessages?: boolean } = {}
): ConversationView[] {
  if (!result || result.error) return getDefaultConversationViews(matches, options);
  return buildConversationViews(result.data ?? [], matches, options);
}

function selectMessages(
  client: MessagePreviewClient,
  columns: string,
  userId?: string | null
) {
  let query = client.from("messages_demo").select(columns);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.order("sent_at", { ascending: true });
}

export async function loadConversationViews(
  client: unknown,
  userId?: string | null,
  matches: CanonicalMatch[] = DEMO_MATCHES
): Promise<ConversationView[]> {
  return (await loadConversationSource(client, userId, matches)).conversations;
}

export async function loadConversationSource(
  client: unknown,
  userId?: string | null,
  matches: CanonicalMatch[] = DEMO_MATCHES
): Promise<ConversationSourceResult> {
  if (userId === null) {
    return conversationSourceResult({
      source: "seed",
      conversations: getDefaultConversationViews(matches),
      reason: "demo-signed-out",
    });
  }

  const messageClient = client as MessagePreviewClient;
  const includeSeedMessages = !userId;
  const fallbackSource = includeSeedMessages ? "seed" : "fallback";

  try {
    const result = await selectMessages(
      messageClient,
      MESSAGE_SELECT_COLUMNS,
      userId
    );

    if (!result.error) {
      const conversations = conversationViewsFromMessageResult(result, matches, {
        includeSeedMessages,
      });
      const hasRows = Boolean(result.data?.length);

      return conversationSourceResult({
        source: hasRows ? "messages" : includeSeedMessages ? "seed" : "empty",
        conversations,
        reason: hasRows
          ? "backend-user"
          : includeSeedMessages
            ? "demo-seed"
            : "backend-empty",
      });
    }
  } catch {
    // Fall through to the minimum column set below. Older demo tables may not
    // have read_at/is_read yet, but saved message text should still load.
  }

  try {
    const result = await selectMessages(
      messageClient,
      MESSAGE_MINIMUM_SELECT_COLUMNS,
      userId
    );

    const conversations = conversationViewsFromMessageResult(result, matches, {
      includeSeedMessages,
    });
    const hasRows = Boolean(result.data?.length);

    return conversationSourceResult({
      source: hasRows ? "messages" : includeSeedMessages ? "seed" : "empty",
      conversations,
      reason: hasRows
        ? "minimum-columns"
        : includeSeedMessages
          ? "demo-seed"
          : "backend-empty",
      usedMinimumColumns: true,
      error: result.error ?? null,
    });
  } catch (error) {
    return conversationSourceResult({
      source: fallbackSource,
      conversations: getDefaultConversationViews(matches, {
        includeSeedMessages,
      }),
      reason: "unavailable",
      error,
    });
  }
}

export async function loadUnreadSummary(client: unknown) {
  return getUnreadSummary(await loadConversationViews(client));
}

export async function loadUnreadSummaryForUser(
  client: unknown,
  userId?: string | null,
  visibleMatchIds?: Iterable<string>
) {
  if (!userId) {
    return getUnreadSummary(await loadConversationViews(client, userId));
  }

  const messageClient = client as MessagePreviewClient;
  const visibleMatchIdSet = visibleMatchIds
    ? new Set(Array.from(visibleMatchIds).filter(Boolean))
    : null;

  function summarizeRows(rows: MessageRow[]) {
    if (!visibleMatchIdSet) {
      return getUnreadSummaryFromRows(rows);
    }

    const messages = rows
      .map((row) => normalizeMessage(row))
      .filter((message): message is Message =>
        Boolean(message && visibleMatchIdSet.has(message.match_id))
      );

    return getUnreadSummaryFromMessages(messages);
  }

  try {
    const result = await selectMessages(
      messageClient,
      MESSAGE_SELECT_COLUMNS,
      userId
    );

    if (!result.error) {
      return summarizeRows(result.data ?? []);
    }
  } catch {
    // Fall through to the minimum column set below for older demo tables.
  }

  try {
    const result = await selectMessages(
      messageClient,
      MESSAGE_MINIMUM_SELECT_COLUMNS,
      userId
    );

    if (!result.error) {
      return summarizeRows(result.data ?? []);
    }
  } catch {}

  return {
    total_unread_count: 0,
    unread_conversation_count: 0,
  };
}

export async function markConversationRead(
  client: unknown,
  userId: string | null | undefined,
  matchId: string,
  readAt = new Date().toISOString()
) {
  if (!userId) return { ok: false, readAt };

  const messageClient = client as MessagePreviewClient;

  try {
    const result = await messageClient
      .from("messages_demo")
      .update({
        read_at: readAt,
        is_read: true,
      })
      .eq("user_id", userId)
      .eq("match_id", matchId)
      .eq("sender", "them");

    if (!result.error) {
      void messageClient
        .from("matches")
        .update({
          unread_count: 0,
        })
        .eq("user_id", userId)
        .eq("match_id", matchId);
    }

    return { ok: !result.error, readAt };
  } catch {
    return { ok: false, readAt };
  }
}
