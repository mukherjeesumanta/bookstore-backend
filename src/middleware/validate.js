"use strict";

const { validationResult } = require("express-validator");

/**
 * Runs express-validator checks and short-circuits with 422 on failures.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validate };
