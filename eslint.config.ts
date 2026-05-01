import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import pluginVitest from "@vitest/eslint-plugin";
import pluginOxlint from "eslint-plugin-oxlint";
import skipFormatting from "eslint-config-prettier/flat";
import boundaries from "eslint-plugin-boundaries";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{vue,ts,mts,tsx}"],
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  ...pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/__tests__/*"],
  },

  ...pluginOxlint.buildFromOxlintConfigFile(".oxlintrc.json"),

  skipFormatting,

  {
    ignores: ["src/App.vue", "src/main.ts", "src/utils/**/*"],
    files: ["src/**/*.{js,ts,vue}"],
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.app.json",
        },
      },
      "boundaries/elements": [
        { type: "domain", pattern: "src/domain/**/*" },
        { type: "application", pattern: "src/application/**/*" },
        { type: "infrastructure", pattern: "src/infrastructure/**/*" },
        { type: "presentation", pattern: ["src/presentation/**/*", "src/App.vue", "src/main.ts"] },
        { type: "shared", pattern: "src/shared/**/*" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": ["error"],
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message: "Architecture violation: ${file.type} cannot import from ${dependency.type}",
          rules: [
            {
              from: { type: "domain" },
              allow: { to: { type: ["domain", "shared"] } },
            },
            {
              from: { type: "application" },
              allow: { to: { type: ["application", "domain", "shared"] } },
            },
            {
              from: { type: "infrastructure" },
              allow: { to: { type: ["infrastructure", "domain", "shared"] } },
            },
            {
              from: { type: "presentation" },
              allow: {
                to: { type: ["presentation", "application", "domain", "infrastructure", "shared"] },
              },
            },
            {
              from: { type: "shared" },
              allow: { to: { type: "shared" } },
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["vue", "pinia", "pixi.js"],
        },
      ],
    },
  },
);
