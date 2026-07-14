const { validationResult } = require('express-validator');

/**
 * Runs express-validator's validationResult and short-circuits with a 422
 * if any validation rule failed.  Drop this as the last middleware in any
 * route's validator chain before the controller.
 *
 * Usage in a route file:
 *   router.post('/', [body('name').notEmpty()], validate, createFoo);
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

module.exports = validate;
