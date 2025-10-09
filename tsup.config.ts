import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  external: ["parse5", "parse5-htmlparser2-tree-adapter", "postcss"],
  format: ["esm", "cjs"],
  minify: true,
  sourcemap: true,
  target: "ESNext",
  treeshake: true,
});
