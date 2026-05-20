export type DataSourceReason =
  | "backend-user"
  | "backend-global"
  | "backend-empty"
  | "backend-error"
  | "backend-error-local"
  | "local-cache"
  | "demo-signed-out"
  | "demo-seed"
  | "minimum-columns"
  | "unavailable";

export type SourceState<TSource extends string> = {
  source: TSource;
  reason: DataSourceReason;
  isFallback: boolean;
  error: unknown | null;
};
