module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // atsService.ts uses NodeNext-style `.js` extensions on its relative imports;
    // strip them so Jest resolves to the actual `.ts` source.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // Vite/esbuild handle default-import interop for the app build; ts-jest
        // needs this told explicitly (e.g. `import Fuse from 'fuse.js'`).
        tsconfig: { esModuleInterop: true },
        diagnostics: {
          ignoreCodes: [1343]
        },
        astTransformers: {
          before: [
            {
              path: 'ts-jest-mock-import-meta',
              options: { metaObjectReplacement: { env: { VITE_GOOGLE_CLIENT_ID: 'test-client-id' } } }
            }
          ]
        }
      }
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
};