import { ValidationError } from '../utils/errors/index.js';

export const validateRequest = (schema) => {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      // Simple custom validation runner (assumes Zod or similar interface, or custom function)
      if (typeof schema === 'function') {
        schema(body);
      } else if (schema && typeof schema.parse === 'function') {
        schema.parse(body);
      }
      c.set('validatedData', body);
      await next();
    } catch (err) {
      if (err.name === 'ZodError') {
        throw new ValidationError(err.errors[0].message);
      }
      throw new ValidationError(err.message);
    }
  };
};
