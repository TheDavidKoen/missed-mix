import { createCookieSessionStorage, type MiddlewareFunction, redirect } from "react-router";

import { cloudflareContext, viewerContext } from "./context";

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

/* Runs before every loader and action under the signed-in layout, including a child's
   action, which a layout loader alone would not cover. */
export const requireViewer: MiddlewareFunction<Response> = async ({ request, context }) => {
  const username = await currentUsername(request, context.get(cloudflareContext).env);
  if (!username) throw redirect("/login");

  context.set(viewerContext, { username, usernameLower: username.toLowerCase() });
};

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
