import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  ssr: {
    /* Vite externalises node_modules in SSR dev, which leaves tr46 to call
       require("punycode/") at runtime, and the Workers runtime has no require.
       The production build bundles it and is unaffected. */
    noExternal: ["mongodb", "whatwg-url", "tr46"],
  },
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      /* mongodb reaches punycode through whatwg-url and tr46 with a trailing
         slash specifier, which the Workers dev environment cannot require at
         runtime. Aliasing it to the package resolves it at build time instead. */
      "punycode/": "punycode/punycode.js",
    },
  },
});
