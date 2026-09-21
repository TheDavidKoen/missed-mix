import { describe, expect, it } from "vitest";

import { pickSchema } from "./spotify";

const pick = {
  id: "4wajJ1o7jWIg62YqpkHC7S",
  name: "Weird Fishes",
  artist: "Radiohead",
  image: "https://i.scdn.co/image/ab67616d00001e02de3c04b5fc750b68899b20a9",
};

describe("pickSchema", () => {
  it("accepts a pick with Spotify artwork", () => {
    expect(pickSchema.safeParse(pick).success).toBe(true);
  });

  it("accepts a pick with no artwork", () => {
    expect(pickSchema.safeParse({ ...pick, image: null }).success).toBe(true);
  });

  it("rejects artwork from any other host", () => {
    const tracker = { ...pick, image: "https://tracker.example/pixel.gif" };
    expect(pickSchema.safeParse(tracker).success).toBe(false);
  });

  it("rejects a lookalike host that only starts with the Spotify name", () => {
    const lookalike = { ...pick, image: "https://i.scdn.co.example.net/x.jpg" };
    expect(pickSchema.safeParse(lookalike).success).toBe(false);
  });
});
