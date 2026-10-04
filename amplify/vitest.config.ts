import { defineConfig } from 'vitest/config';

// Tests for the agent's Converse loop and tool dispatch. These exercise the pure
// logic with a mocked Bedrock Converse function and an in-memory household repo —
// no AWS calls.
export default defineConfig({
  test: {
    include: ['functions/**/*.test.ts'],
    environment: 'node',
  },
});
