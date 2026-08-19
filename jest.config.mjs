// jest.config.mjs
// Plain ESM rather than jest.config.ts: jest loads a .ts config through ts-node,
// whose compiler-API calls fail against the TypeScript 7 native compiler, and
// node 20 (the oldest entry in the CI matrix) has no native type stripping.
export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],

  // @swc/jest, not ts-jest: ts-jest 29 peers on `typescript <7` and there is no
  // TypeScript 7 compatible release. swc only strips types, so the type
  // checking ts-jest used to give the test file now lives in `npm run typecheck`.
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript" },
          target: "es2020"
        }
      }
    ]
  }
};
