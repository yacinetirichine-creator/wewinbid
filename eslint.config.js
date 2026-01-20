const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const next = require('@next/eslint-plugin-next');

module.exports = [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/public/**',
      '**/supabase/**',
      '**/*.sql',
      // Generated types
      'src/types/database.ts',
    ],
  },

  js.configs.recommended,

  // Ensure TypeScript/TSX parsing works under flat config.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // React + hooks (flat configs)
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,

  // Next.js rules (flat config)
  next.configs['core-web-vitals'],

  // Project-specific overrides: keep lint useful without forcing a large refactor.
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/no-unescaped-entities': 'off',

      // In a TS/Next.js codebase, `no-undef` is often noisy (React/JSX runtime,
      // Node config files, Jest globals, TS-only namespaces, etc.).
      'no-undef': 'off',
      'no-constant-binary-expression': 'off',

      // This repo relies on TypeScript for these checks.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // React w/ TS doesn't use runtime prop-types.
      'react/prop-types': 'off',

      // Avoid huge churn from style-ish rules.
      'no-case-declarations': 'off',

      // These additional react-hooks rules are too strict for the current codebase.
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
