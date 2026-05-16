import {
  MESSAGE_MINIMUM_SELECT_COLUMNS,
  MESSAGE_SELECT_COLUMNS,
  buildConversationViews,
  getUnreadSummary,
  type ConversationView,
  type MessageRow,
} from "./message-model";
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
    update(values: {
      read_at: string;
      is_read: boolean;
    }): MessageReadUpdateQuery;
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

export function getDefaultConversationViews(
  matches: CanonicalMatch[] = DEMO_MATCHES
): ConversationView[] {
  return buildConversationViews([], matches);
}

export function conversationViewsFromMessageResult(
  result: MessageQueryResult | null | undefined,
  matches: CanonicalMatch[] = DEMO_MATCHES
): ConversationView[] {
  if (!result || result.error) return getDefaultConversationViews(matches);
  return buildConversationViews(result.data ?? [], matches);
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
  if (userId === null) {
    return getDefaultConversationViews(matches);
  }

  const messageClient = client as MessagePreviewClient;

  try {
    const result = await selectMessages(
      messageClient,
      MESSAGE_SELECT_COLUMNS,
      userId
    );

    if (!result.error) {
      return conversationViewsFromMessageResult(result, matches);
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

    return conversationViewsFromMessageResult(result, matches);
  } catch {
    return getDefaultConversationViews(matches);
  }
}

export async function loadUnreadSummary(client: unknown) {
  return getUnreadSummary(await loadConversationViews(client));
}

export async function loadUnreadSummaryForUser(
  client: unknown,
  userId?: string | null
) {
  return getUnreadSummary(await loadConversationViews(client, userId));
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

    return { ok: !result.error, readAt };
  } catch {
    return { ok: false, readAt };
  }
}
