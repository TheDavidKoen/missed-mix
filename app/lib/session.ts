import { createCookieSessionStorage, redirect } from "react-router";

/* Built per request rather than once at module scope, because the signing secret
   arrives with the request. See the note in workers/app.ts. */
function sessionStorage(env: Env) {
  return createCookieSessionStorage<{ username: string }>({
    cookie: {
      name: "__mm_session",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 7,
      secrets: [env.SESSION_SECRET],
    },
  });
}

export async function currentUsername(request: Request, env: Env) {
  const session = await sessionStorage(env).getSession(request.headers.get("Cookie"));
  const username = session.get("username");

  return typeof username === "string" ? username : null;
}

export async function startSession(env: Env, username: string, to: string) {
  const storage = sessionStorage(env);
  const session = await storage.getSession();
  session.set("username", username);

  return redirect(to, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
}

export async function endSession(request: Request, env: Env, to: string) {
  const storage = sessionStorage(env);
  const session = await storage.getSession(request.headers.get("Cookie"));

  return redirect(to, {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
}
