// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'tests/e2e/**', 'playwright-report/**'],
  },
  {
    rules: {
      // Quote-heavy scripture UI; escaping every literal hurts readability
      'react/no-unescaped-entities': 'off',
    },
  },
]);
