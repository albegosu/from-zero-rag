import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'server/utils/**/*.ts',
        'server/middleware/**/*.ts',
      ],
      thresholds: {
        lines: 25,
        functions: 40,
        branches: 50,
        statements: 25,
      },
    },
  },
})
