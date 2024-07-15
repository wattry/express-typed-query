import eslint from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import tsEslint from 'typescript-eslint';

const config = tsEslint.config(
  {
    // config with just ignores is the replacement for `.eslinTDisable`
    ignores: ['**/build/**', '**/dist/**', "jest.config.js", "examples", "eslint.config.mjs"],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.strict,
  {
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
      jest: jestPlugin,
    },
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    // enable jest rules on test files
    files: ['test/**'],
    ...jestPlugin.configs['flat/recommended'],
  },
);

export default config;
