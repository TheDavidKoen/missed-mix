import type { ZodError } from "zod";

export function fieldErrorsFrom(error: ZodError | null): Record<string, string> {
  const firstPerField = (error?.issues ?? [])
    .map((issue) => [String(issue.path[0] ?? ""), issue.message] as const)
    .filter(([field]) => field)
    .reverse();

  return Object.fromEntries(firstPerField);
}

export function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value === "") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
