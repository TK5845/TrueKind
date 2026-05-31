import type { CSSProperties } from "react";
import {
  formatUnreadCount,
  type ConversationAttentionState,
} from "./message-model";

type MessageRowAttentionBadgesProps = {
  state: ConversationAttentionState;
  unreadCount: number;
  pillStyle: (dark?: boolean) => CSSProperties;
};

export function MessageRowAttentionBadges({
  state,
  unreadCount,
  pillStyle,
}: MessageRowAttentionBadgesProps) {
  if (state === "needs-reply") {
    return (
      <>
        <span style={pillStyle(true)}>Behöver svar</span>
        <span style={pillStyle(true)}>{formatUnreadCount(unreadCount)}</span>
      </>
    );
  }

  if (state === "follow-up") {
    return <span style={pillStyle()}>Dags att följa upp</span>;
  }

  return null;
}
