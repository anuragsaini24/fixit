import { HttpError } from '../utils/httpError.js';

export function validate(schemas) {
  return function validateRequest(request, response, next) {
    const parsed = {};
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(request[part]);
      if (!result.success) {
        const details = result.error.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
        return next(new HttpError(400, 'Request validation failed.', details));
      }
      parsed[part] = result.data;
    }
    request.validated = { ...request.validated, ...parsed };
    next();
  };
}