import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import type { MusicPick, PickKind } from "~/lib/spotify";

export function MusicPicker({
  name,
  kind,
  label,
  initial,
  featured = false,
}: {
  name: string;
  kind: PickKind;
  label: string;
  initial: MusicPick | null;
  featured?: boolean;
}) {
  const fetcher = useFetcher<{ results: MusicPick[] }>();
  const [selected, setSelected] = useState<MusicPick | null>(initial);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) return;

    const timer = setTimeout(() => {
      fetcher.load(`/api/search?kind=${kind}&q=${encodeURIComponent(query)}`);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, kind, fetcher.load]);

  const results = fetcher.data?.results ?? [];
  const size = featured ? "size-20 sm:size-28" : "size-14";

  return (
    <div className="min-w-0 rounded-2xl bg-raised p-4 sm:p-5">
      {label ? (
        <p className={`font-bold tracking-tight ${featured ? "text-lg" : "text-sm"}`}>{label}</p>
      ) : null}

      <input type="hidden" name={name} value={selected ? JSON.stringify(selected) : ""} />

      {/* The selected row is a column until sm, so the button drops below the name
          instead of competing with it for a narrow row. */}
      {selected ? (
        <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
            {selected.image ? (
              <img
                src={selected.image}
                alt=""
                className={`${size} shrink-0 rounded-xl object-cover`}
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{selected.name}</p>
              {selected.artist ? (
                <p className="truncate text-sm text-muted">{selected.artist}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="shrink-0 self-start rounded-pill border border-line px-4 py-1.5 text-sm hover:border-ink sm:self-auto sm:px-3 sm:py-1"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${kind}s`}
            className="mt-3 w-full rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink placeholder:text-muted"
          />

          {results.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(result);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-raised-hover"
                  >
                    {result.image ? (
                      <img
                        src={result.image}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="size-10 shrink-0 rounded-lg bg-surface" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{result.name}</span>
                      {result.artist ? (
                        <span className="block truncate text-xs text-muted">{result.artist}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
