const js = require("@eslint/js");
const globals = require("globals");

const reglasComunes = {
  "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  eqeqeq: ["error", "always"],
  "no-var": "error",
  "prefer-const": "error",
  "no-shadow": "warn",
  curly: ["warn", "multi-line"],
};

module.exports = [
  {
    ignores: ["**/node_modules/**", "backend/generated/**", "backend/prisma/**", "backend/coverage/**", "reportes/**"],
  },
  js.configs.recommended,

  // Backend (Node.js, CommonJS)
  {
    files: ["backend/**/*.js", "eslint.config.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: globals.node },
    rules: reglasComunes,
  },

  // Pruebas Jest
  {
    files: ["backend/tests/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },

  // Frontend (navegador, scripts clásicos con jQuery)
  {
    files: ["backend/public/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser, $: "readonly", jQuery: "readonly", Modelo: "readonly", Vista: "readonly", Controlador: "readonly" },
    },
    rules: reglasComunes,
  },
];
