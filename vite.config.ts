import { defineConfig } from "vite";
export default defineConfig({
  base: "/",
  build: {
    lib: {
      entry: ["./src/code-mirror.ts", "./src/json-editor.ts"],
      formats: ["es"],
      fileName: (_, name) => `${name}.js`,
    },
  },
});
