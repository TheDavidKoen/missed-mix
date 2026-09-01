import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("profile", "routes/profile.tsx"),
  route("api/search", "routes/api.search.tsx"),
  route("avatar/:username", "routes/avatar.$username.tsx"),
] satisfies RouteConfig;
