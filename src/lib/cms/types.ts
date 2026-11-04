export type CmsResult<T> =
  | { status: "success"; data: T[] }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "unconfigured" };
