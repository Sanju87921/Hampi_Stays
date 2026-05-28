import { ValidationError } from '../../utils/errors/index.js';

export const validateRequired = (data, fields) => {
  const missing = fields.filter(f => data[f] === undefined || data[f] === null || data[f] === '');
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  if (!phone || !phoneRegex.test(phone)) {
    throw new ValidationError('Invalid phone format');
  }
};
