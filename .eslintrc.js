module.exports = {
  extends: "eslint:recommended",
  env: {
    browser: true,
    node: true,
    es6: true,
    "jest/globals": true,
  },
  parser: "babel-eslint",
  plugins: ["jest"],
  rules: {
    strict: 0,
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: false }],
    "no-underscore-dangle": "off",
    "max-len": [
      "error",
      {
        code: 100,
        comments: 200,
        ignoreTrailingComments: true,
      },
    ],
  },
};
