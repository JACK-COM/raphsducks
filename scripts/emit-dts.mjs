// Produces the .d.mts declaration twins that package.json's "import" condition
// points at. `tsc --emitDeclarationOnly` writes only .d.ts, and it writes
// relative specifiers extensionless; a .d.mts read under nodenext needs the
// .mjs-flavoured specifier so it resolves to the .d.mts twin rather than
// crossing back into the CJS-flavoured .d.ts.
//
// tsup's bundled rollup-plugin-dts used to emit both flavours. It reads
// TypeScript compiler internals that the TypeScript 7 native compiler does not
// expose, so it crashes on load and the emit moved here.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const LIB = "lib";

// Rewrites the specifier in `from "./x"` / `from "./x.js"` and in a
// `import("./x")` type position. Bare specifiers are left alone.
const retarget = (source, ext) =>
  source.replace(
    /(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.\.?\/[^"']*?)\2/g,
    (_m, lead, quote, spec) =>
      `${lead}${quote}${spec.replace(/\.(m?js)$/, "")}${ext}${quote}`
  );

const declarations = (await readdir(LIB)).filter((f) => f.endsWith(".d.ts"));
if (declarations.length === 0) {
  throw new Error("emit-dts: no .d.ts files in lib/; did tsc run?");
}

for (const name of declarations) {
  const path = join(LIB, name);
  const source = await readFile(path, "utf8");
  await writeFile(path, retarget(source, ".js"));
  await writeFile(join(LIB, name.replace(/\.d\.ts$/, ".d.mts")), retarget(source, ".mjs"));
}

console.log(`DTS  ${declarations.length} declaration file(s) -> .d.ts + .d.mts`);
