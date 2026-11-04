/**
 * Hand-drawn, deliberately imperfect globe. Replaces the old "H" mark everywhere.
 */
export function GlobeMark({
  className,
  strokeWidth = 3,
  "aria-hidden": ariaHidden,
}: {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : "Street Smart globe"}
      aria-hidden={ariaHidden}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* wobbly outer circle */}
      <path d="M50 6c25 1 43 20 44 43 1 24-19 45-44 45S5 74 6 49C7 26 25 7 50 6z" />
      {/* equator, drawn slightly off */}
      <path d="M8 47c14 7 28 10 42 10s28-3 42-11" />
      <path d="M9 63c13 6 26 9 41 9s28-3 41-9" />
      <path d="M12 33c12-6 24-9 38-9s27 3 39 10" />
      {/* meridians */}
      <path d="M50 6c-13 13-19 28-19 44s6 30 19 44" />
      <path d="M50 6c13 13 20 28 20 44s-7 30-20 44" />
      <path d="M50 6v88" />
      {/* small hand-inked pin */}
      <path d="M63 36c0 5-6 9-6 9s-6-4-6-9a6 6 0 0112 0z" />
    </svg>
  );
}
