import { describe, expect, it } from "vitest";
import { parsePicks, profileSchema } from "./profile";
import { pairKey } from "./vibrations";

describe("profileSchema", () => {
  const picks = {
    childhood: null,
    excited: null,
    cloudy: null,
    work: null,
    topAlbum: null,
    currentSong: null,
  };

  it("accepts a profile with only a first name", () => {
    expect(profileSchema.safeParse({ firstName: "Ada", description: "", picks }).success).toBe(
      true,
    );
  });

  it("rejects a missing first name and an over-long quote", () => {
    const result = profileSchema.safeParse({
      firstName: "  ",
      description: "x".repeat(201),
      picks,
    });
    expect(result.success).toBe(false);
  });
});

describe("parsePicks", () => {
  it("reads each pick field, and treats a blank or broken one as unanswered", () => {
    const form = new FormData();
    form.set("pick.topAlbum", '{"id":"1","name":"Album","artist":null,"image":null}');
    form.set("pick.currentSong", "{broken");

    const picks = parsePicks(form);
    expect(picks.topAlbum).toEqual({ id: "1", name: "Album", artist: null, image: null });
    expect(picks.currentSong).toBeNull();
    expect(picks.childhood).toBeNull();
  });
});

describe("pairKey", () => {
  it("names a pair the same way whichever side asks", () => {
    expect(pairKey("rich", "dave")).toBe(pairKey("dave", "rich"));
  });
});
