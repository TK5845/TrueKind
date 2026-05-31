import type { ConversationAttentionState } from "./message-model";

type ConversationRowEmphasisInput = {
  state: ConversationAttentionState;
  isActive: boolean;
  activeBackground: string;
  neutralBackground: string;
  actionableBackground?: string;
};

export function getConversationRowEmphasisStyle({
  state,
  isActive,
  activeBackground,
  neutralBackground,
  actionableBackground = "rgba(255,255,255,0.94)",
}: ConversationRowEmphasisInput) {
  const isActionable = state !== "neutral";

  return {
    border: isActive
      ? "1px solid rgba(17,17,17,0.16)"
      : state === "needs-reply"
        ? "1px solid rgba(17,17,17,0.24)"
        : state === "follow-up"
          ? "1px solid rgba(124,93,70,0.28)"
          : "1px solid rgba(231,223,218,0.95)",
    background: isActive
      ? activeBackground
      : isActionable
        ? actionableBackground
        : neutralBackground,
    isActionable,
  };
}
