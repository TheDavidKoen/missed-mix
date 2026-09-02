import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),

  layout("routes/signed-in.tsx", [
    route("profile", "routes/profile.tsx"),
    route("mixers", "routes/mixers.tsx"),
    route("mixers/:username", "routes/mixers.$username.tsx"),
    route("vibrations", "routes/vibrations.tsx"),
    route("vibrations/:username", "routes/vibrations.$username.tsx"),
  ]),

  route("api/search", "routes/api.search.tsx"),
  route("avatar/:username", "routes/avatar.$username.tsx"),
] satisfies RouteConfig;
