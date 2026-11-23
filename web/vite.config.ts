import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // The app shows this in the bottom right corner. Bump it in package.json.
  define: { __APP_VERSION__: JSON.stringify(version) },
});
