import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  { ignores: ['**/node_modules/', '**/dist/', '**/coverage/', 'api/data/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      complexity: ['warn', 8],
      'max-depth': ['warn', 3],
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off'
    }
  },
  {
    files: ['api/**/*.{js,mjs}', '*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    files: ['web/**/*.{js,vue}'],
    languageOptions: { globals: { ...globals.browser } }
  }
];
