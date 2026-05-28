export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Error') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication Error') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden Access') {
    super(message, 403, 'FORBIDDEN_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class BookingError extends AppError {
  constructor(message = 'Booking Error') {
    super(message, 400, 'BOOKING_ERROR');
  }
}

export class PaymentError extends AppError {
  constructor(message = 'Payment Error') {
    super(message, 400, 'PAYMENT_ERROR');
  }
}

export class AdminError extends AppError {
  constructor(message = 'Admin Operation Error') {
    super(message, 400, 'ADMIN_ERROR');
  }
}
