import { defineConfig } from "vite";
export default defineConfig({
  base: "/",
  build: {
    lib: {
      entry: "./src/code-mirror.ts",
      formats: ["es"],
      fileName: "code-mirror",
    },
  },
});
