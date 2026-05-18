// eslint.config.js — ESLint v9 flat config for Nano File Exchange frontend
// Uses the new flat config format (replaces .eslintrc.*)

import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

export default [
  // ── 1. Global ignores ────────────────────────────────────────────────────
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.min.js",
      "public/**",
      "coverage/**",
    ],
  },

  // ── 2. Base JS recommended rules ─────────────────────────────────────────
  js.configs.recommended,

  // ── 3. Main config for all JS/JSX source files ───────────────────────────
  {
    files: ["src/**/*.{js,jsx}"],

    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      "unused-imports": unusedImports,
    },

    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    settings: {
      react: {
        // Let ESLint auto-detect the React version instead of hard-coding it
        version: "detect",
      },
    },

    rules: {
      // ── React ──────────────────────────────────────────────────────────
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      // Require key prop for elements in arrays/iterators
      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      // Warn on self-closing JSX tags that have no children (<Foo /> not <Foo></Foo>)
      "react/self-closing-comp": "warn",
      // No direct children mutation
      "react/no-direct-mutation-state": "error",
      // No deprecated findDOMNode usage
      "react/no-find-dom-node": "error",
      // Prevent missing displayName for React components
      "react/display-name": "off",
      // No prop-types (project uses JSX without TypeScript strict props — acceptable)
      "react/prop-types": "off",
      // New JSX transform — no need to import React in scope
      "react/react-in-jsx-scope": "off",
      // Warn on unused state fields
      "react/no-unused-state": "warn",
      // Prevent usage of string refs
      "react/no-string-refs": "error",

      // ── React Hooks ────────────────────────────────────────────────────
      // Enforce Hook rules (must be at top level, only in functions)
      "react-hooks/rules-of-hooks": "error",
      // Warn on missing or incorrect useEffect/useCallback/useMemo deps
      "react-hooks/exhaustive-deps": "warn",

      // ── Accessibility (jsx-a11y) ───────────────────────────────────────
      // Images must have descriptive alt text
      "jsx-a11y/alt-text": "error",
      // Anchor elements must have content
      "jsx-a11y/anchor-has-content": "warn",
      // <a> with href="#" is a bad pattern
      "jsx-a11y/anchor-is-valid": "warn",
      // Headings must have text content
      "jsx-a11y/heading-has-content": "warn",
      // Interactive elements must be focusable
      "jsx-a11y/interactive-supports-focus": "warn",

      // ── Import order & hygiene ─────────────────────────────────────────
      // No duplicate imports
      "import/no-duplicates": "error",
      // Warn on imports that don't resolve (turned to warn — TS paths can confuse)
      "import/no-unresolved": "off",
      // Warn if a module imports something only exported in tests
      "import/no-extraneous-dependencies": "off",
      // Consistent import order: builtin → external → internal → relative
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // ── General JS quality ─────────────────────────────────────────────
      // Warn on console.log calls left in code (console.error/warn are allowed)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // unused-imports plugin: auto-fixable unused import removal.
      // Replaces the built-in no-unused-vars for imports so --fix actually
      // deletes the dead import lines/specifiers rather than just warning.
      "no-unused-vars": "off",                        // Disabled — handled below
      "unused-imports/no-unused-imports": "warn",     // Removes whole import lines
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // No var declarations — use const/let
      "no-var": "error",
      // Prefer const for variables that are never reassigned
      "prefer-const": ["error", { destructuring: "all" }],
      // No duplicate object keys
      "no-dupe-keys": "error",
      // Eqeqeq — always use === except null comparisons
      "eqeqeq": ["error", "always", { null: "ignore" }],
      // Prevent accidental fall-through in switch
      "no-fallthrough": "error",
      // Disallow empty block statements (except catch blocks)
      "no-empty": ["warn", { allowEmptyCatch: true }],
      // No useless escape in strings
      "no-useless-escape": "warn",
      // Prefer template literals over string concatenation
      "prefer-template": "warn",
      // Warn on debugger statements
      "no-debugger": "warn",
    },
  },

  // ── 4. Config files (vite.config.js, postcss, etc.) — looser rules ───────
  {
    files: ["*.config.{js,mjs,cjs}", "postcss.config.*"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },
];
