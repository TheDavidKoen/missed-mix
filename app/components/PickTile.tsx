import type { MusicPick } from "~/lib/spotify";

/* The read-only twin of MusicPicker: the same card without the search field or
   the Change control, for looking at somebody else's answers. */
export function PickTile({
  label,
  pick,
  big = false,
}: {
  label: string;
  pick: MusicPick | null | undefined;
  big?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-raised p-4 sm:p-5">
      <p className={`font-bold tracking-tight ${big ? "text-base" : "text-sm"}`}>{label}</p>

      {pick ? (
        <div className="mt-4 flex min-w-0 items-center gap-3 sm:gap-4">
          {pick.image ? (
            <img
              src={pick.image}
              alt=""
              className={`${big ? "size-20 sm:size-24" : "size-12"} shrink-0 rounded-xl object-cover`}
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{pick.name}</p>
            {pick.artist ? <p className="truncate text-sm text-muted">{pick.artist}</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Not answered.</p>
      )}
    </div>
  );
}
