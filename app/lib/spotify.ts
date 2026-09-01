import { z } from "zod";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";
const IMAGE_HOST = "https://i.scdn.co/";

export const pickKindSchema = z.enum(["artist", "album", "track"]);
export type PickKind = z.infer<typeof pickKindSchema>;

export type MusicPick = {
  id: string;
  name: string;
  artist: string | null;
  image: string | null;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function requestToken(env: Env) {
  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) throw new Error(`Spotify token request failed: ${response.status}`);

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };

  return cachedToken.value;
}

async function accessToken(env: Env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  return requestToken(env);
}

const image = z.array(z.object({ url: z.string() })).default([]);
const named = z.array(z.object({ name: z.string() })).default([]);

const artistItem = z.object({ id: z.string(), name: z.string(), images: image });
const albumItem = z.object({
  id: z.string(),
  name: z.string(),
  artists: named,
  images: image,
});
const trackItem = z.object({
  id: z.string(),
  name: z.string(),
  artists: named,
  album: z.object({ images: image }),
});

const searchBody = z.object({
  artists: z.object({ items: z.array(artistItem) }).optional(),
  albums: z.object({ items: z.array(albumItem) }).optional(),
  tracks: z.object({ items: z.array(trackItem) }).optional(),
});

function pickImage(images: { url: string }[]) {
  return images[1]?.url ?? images[0]?.url ?? null;
}

function joinArtists(artists: { name: string }[]) {
  return artists.map((entry) => entry.name).join(", ") || null;
}

export async function search(env: Env, kind: PickKind, query: string): Promise<MusicPick[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("type", kind);
  url.searchParams.set("limit", "8");

  const call = async (token: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  let response = await call(await accessToken(env));

  if (response.status === 401) {
    cachedToken = null;
    response = await call(await requestToken(env));
  }

  if (!response.ok) throw new Error(`Spotify search failed: ${response.status}`);

  const body = searchBody.parse(await response.json());

  if (kind === "artist") {
    return (body.artists?.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      artist: null,
      image: pickImage(item.images),
    }));
  }

  if (kind === "album") {
    return (body.albums?.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      artist: joinArtists(item.artists),
      image: pickImage(item.images),
    }));
  }

  return (body.tracks?.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    artist: joinArtists(item.artists),
    image: pickImage(item.album.images),
  }));
}

export const pickSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  artist: z.string().max(200).nullable(),
  image: z
    .string()
    .url()
    .refine((value) => value.startsWith(IMAGE_HOST), "Unexpected image host.")
    .nullable(),
});
