const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    ignores: ["dist/*", "node_modules/*"],
  }
];
