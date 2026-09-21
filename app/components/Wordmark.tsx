const LEAD = [
  [5, 11, 32],
  [5, 22, 16],
  [5, 33, 26],
  [5, 44, 10],
] as const;

const ANSWER = [
  [46, 11, 13],
  [30, 22, 29],
  [40, 33, 19],
  [24, 44, 35],
] as const;

function Bars({ rows }: { rows: readonly (readonly [number, number, number])[] }) {
  return rows.map(([x, y, width]) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={width} height={9} rx={4.5} />
  ));
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.45em] align-top font-black tracking-[-0.045em] ${className}`}
    >
      <svg
        viewBox="5 11 54 42"
        aria-hidden="true"
        fill="currentColor"
        className="h-[1em] w-[1.286em] shrink-0 text-accent"
      >
        <Bars rows={LEAD} />
        <g opacity={0.42}>
          <Bars rows={ANSWER} />
        </g>
      </svg>
      Missed Mix
    </span>
  );
}
