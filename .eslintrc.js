module.exports = {
    // extends: "eslint:recommended",
    parser: "babel-eslint",
    rules: {
        strict: 0,
        "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: false }]
    }
};
