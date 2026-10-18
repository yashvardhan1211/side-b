/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Only test lib/ and data/ — no Next.js runtime needed
  testPathPattern: ["lib/__tests__", "data/__tests__"],
};

module.exports = config;
