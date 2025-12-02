// jest.config.ts
import { createDefaultPreset, JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  ...createDefaultPreset(),

  // Supplement to use of `baseUrl` in tsconfig: map
  // additional directories here (example shown)
  //   moduleNameMapper: {
  //     "^components/(.*)$": "<rootDir>/src/components/$1",
  //   },
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+.tsx?$": "ts-jest"
  }
};

export default jestConfig;
