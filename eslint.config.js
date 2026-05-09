// Flat config. https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'node_modules/*',
      'ios/*',
      'android/*',
      'coverage/*',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
    },
  },
  {
    // The logger is the only file authorized to call console.* directly.
    files: ['lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Test files and jest setup may use console for debugging output.
    files: ['**/*.test.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);
