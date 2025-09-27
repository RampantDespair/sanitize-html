import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  external: [
    "deepmerge",
    "escape-string-regexp",
    "htmlparser2",
    "is-plain-object",
    "parse-srcset",
    "postcss",
  ],
  format: ["esm", "cjs"],
  minify: true,
  sourcemap: true,
  target: "ESNext",
  treeshake: true,
});
