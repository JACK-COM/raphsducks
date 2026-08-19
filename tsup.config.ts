import { defineConfig } from "tsup";

// Dual ESM + CJS build. The ESM entry (lib/index.mjs) exposes `createState` as a
// native default export, which modern bundlers (Vite 8 / Rolldown) consume
// without the CJS-interop ambiguity that made `import createState from ...`
// resolve to the module object instead of the function.
//
// `types` is emitted as a second entry so the long-standing deep-import path
// `@jackcom/raphsducks/lib/types` keeps resolving (preserved in package.json
// "exports"); existing consumers of that subpath are unaffected.
//
// `dts` is off: tsup bundles rollup-plugin-dts, which is built against the old
// JS TypeScript compiler and crashes on TypeScript 7's native one. Declarations
// come from `tsc --emitDeclarationOnly` plus scripts/emit-dts.mjs, run after
// this build because `clean` wipes outDir.
export default defineConfig({
  entry: ["src/index.ts", "src/types.ts"],
  format: ["esm", "cjs"],
  dts: false,
  minify: true,
  clean: true,
  outDir: "lib",
  target: "es2020",
  sourcemap: false
});
