import { useEffect, useState } from "react";

export function AvatarField({
  label,
  hint,
  error,
  saved,
}: {
  label: string;
  hint: string;
  error?: string | null;
  saved: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const src = preview ?? saved;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
      {src ? (
        <img src={src} alt="" className="size-24 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="size-24 shrink-0 rounded-full bg-raised" />
      )}

      <div className="flex w-full min-w-0 flex-col gap-2">
        <label htmlFor="avatar" className="text-sm font-bold tracking-tight">
          {label}
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={error ? "avatar-error" : "avatar-hint"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="w-full min-w-0 text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-accent file:px-5 file:py-2 file:font-bold file:text-on-accent"
        />
        {error ? (
          <p id="avatar-error" className="text-sm text-danger">
            {error}
          </p>
        ) : (
          <p id="avatar-hint" className="text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
