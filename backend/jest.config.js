module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup/env.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "services/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "html", "json-summary"],
  testTimeout: 20000,
  // Chay tuan tu: cac test tich hop dung chung mot co so du lieu
  maxWorkers: 1,
  verbose: true,
};
