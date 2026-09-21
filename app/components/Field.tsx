const control =
  "rounded-xl border border-line bg-raised px-4 py-3 text-base text-ink placeholder:text-muted";

export function Field({
  name,
  label,
  error,
  hint,
  defaultValue,
  type = "text",
  autoComplete,
  required = true,
  maxLength,
  multiline = false,
  rows = 3,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  const shared = {
    id: name,
    name,
    defaultValue,
    required,
    maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : hint ? hintId : undefined,
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-bold tracking-tight">
        {label}
      </label>

      {multiline ? (
        <textarea {...shared} rows={rows} className={`${control} resize-none`} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} className={control} />
      )}

      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
