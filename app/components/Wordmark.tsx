export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-black tracking-tight ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="size-6 shrink-0 text-accent"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M7 15.5v-7l5 3.5 5-3.5v7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Missed Mix
    </span>
  );
}
