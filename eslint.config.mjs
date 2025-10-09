// @ts-check

import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  // Global ignores (replacement for .eslintignore)
  globalIgnores([
    ".vscode",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "public",
  ]),

  // Configs
  eslint.configs.recommended,
  tseslint.configs.recommended,

  importPlugin.flatConfigs.recommended,
  perfectionistPlugin.configs["recommended-alphabetical"],

  // Options
  {
    // include patterns
    files: ["**/*.{js,ts,mjs,mts,cjs,cts}"],
    // options
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: true,
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
      sourceType: "module",
    },
    // rules
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: true,
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "import/no-duplicates": ["error", { "prefer-inline": false }],
      "import/no-unresolved": [
        "error",
        {
          ignore: ["typescript-eslint"],
        },
      ],
    },
    // settings
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
  },
);
