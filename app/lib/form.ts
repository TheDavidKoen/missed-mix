import type { ZodError } from "zod";

export function fieldErrorsFrom(error: ZodError | null): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!error) return fieldErrors;

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }

  return fieldErrors;
}
