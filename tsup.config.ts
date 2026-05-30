import { defineConfig } from "tsup";

// Dual ESM + CJS build. The ESM entry (lib/index.mjs) exposes `createState` as a
// native default export, which modern bundlers (Vite 8 / Rolldown) consume
// without the CJS-interop ambiguity that made `import createState from ...`
// resolve to the module object instead of the function.
//
// `types` is emitted as a second entry so the long-standing deep-import path
// `@jackcom/raphsducks/lib/types` keeps resolving (preserved in package.json
// "exports"); existing consumers of that subpath are unaffected.
export default defineConfig({
  entry: ["src/index.ts", "src/types.ts"],
  format: ["esm", "cjs"],
  dts: true,
  minify: true,
  clean: true,
  outDir: "lib",
  target: "es2020",
  sourcemap: false
});
