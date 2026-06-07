export type QuerySelectionResult<T> = {
  selectedItem: T | null;
  queryItem: T | null;
  hasUnavailableQuery: boolean;
};

export function resolveQuerySelection<T>(
  items: T[],
  input: {
    queryId: string | null;
    selectedId: string | null;
    shouldFlagUnavailableQuery: boolean;
    getId: (item: T) => string;
  }
): QuerySelectionResult<T> {
  const queryItem = input.queryId
    ? items.find((item) => input.getId(item) === input.queryId) ?? null
    : null;
  const hasUnavailableQuery = Boolean(
    input.queryId && input.shouldFlagUnavailableQuery && !queryItem
  );

  return {
    selectedItem: hasUnavailableQuery
      ? null
      : items.find((item) => input.getId(item) === input.selectedId) ??
        items[0] ??
        null,
    queryItem,
    hasUnavailableQuery,
  };
}
