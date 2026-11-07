import { validationError } from '../errors/appError.mjs';

const toDetails = (issues, fallbackField) =>
  issues.map((issue) => ({ field: issue.path.join('.') || fallbackField, message: issue.message }));

// Checks req.params and/or req.body against zod schemas and puts the clean values on req.valid.
// Params are checked first, so a bad id is reported before a bad body.
export const validate = ({ params, body }) => (req, _res, next) => {
  req.valid = {};

  if (params) {
    const result = params.safeParse(req.params);
    if (!result.success) return next(validationError(toDetails(result.error.issues, 'params')));
    req.valid.params = result.data;
  }

  if (body) {
    const result = body.safeParse(req.body);
    if (!result.success) return next(validationError(toDetails(result.error.issues, 'body')));
    req.valid.body = result.data;
  }

  next();
};
