import { describe, expect, it } from "vitest";
import { z } from "zod";

import { fieldErrorsFrom, parseJson } from "./form";

describe("fieldErrorsFrom", () => {
  const schema = z.object({
    name: z
      .string()
      .min(3, "Too short.")
      .regex(/^[a-z]+$/, "Letters only."),
    age: z.number({ message: "Not a number." }),
  });

  it("keeps the first message for each field", () => {
    const result = schema.safeParse({ name: "a1", age: "x" });
    expect(fieldErrorsFrom(result.success ? null : result.error)).toEqual({
      name: "Too short.",
      age: "Not a number.",
    });
  });

  it("returns an empty map when there is no error", () => {
    expect(fieldErrorsFrom(null)).toEqual({});
  });
});

describe("parseJson", () => {
  it("parses a JSON form value", () => {
    expect(parseJson('{"id":"1"}')).toEqual({ id: "1" });
  });

  it("returns null for empty, malformed or non-text values", () => {
    expect(parseJson("")).toBeNull();
    expect(parseJson("{not json")).toBeNull();
    expect(parseJson(null)).toBeNull();
  });
});
