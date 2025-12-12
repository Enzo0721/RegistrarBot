import config from '#config';

/**
 * Custom error classes for different error types
 */

export class AppError extends Error {
	constructor(message, statusCode = 500, details = null) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.details = details;
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message, details = null) {
		super(message, 400, details);
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found', details = null) {
		super(message, 404, details);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Unauthorized', details = null) {
		super(message, 401, details);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Forbidden', details = null) {
		super(message, 403, details);
	}
}

export class ConflictError extends AppError {
	constructor(message = 'Conflict', details = null) {
		super(message, 409, details);
	}
}

/**
 * Standardized error response format
 */
export function formatErrorResponse(error, includeStack = false) {
	const response = {
		success: false,
		error: error.message || 'An error occurred',
		...(error.details && { details: error.details })
	};

	// Only include stack trace in development
	if (includeStack && process.env.NODE_ENV === 'development') {
		response.stack = error.stack;
	}

	return response;
}

/**
 * Error handling middleware
 * Must be added after all routes
 */
export function errorHandler(err, req, res, next) {
	// Log the error
	const errorMessage = err.message || 'Unknown error';
	const statusCode = err.statusCode || 500;
	const isOperational = err.isOperational || false;

	// Log error with appropriate level
	if (statusCode >= 500) {
		config.error('Server Error:', {
			message: errorMessage,
			statusCode,
			path: req.path,
			method: req.method,
			stack: err.stack
		});
	} else if (statusCode >= 400) {
		config.warn('Client Error:', {
			message: errorMessage,
			statusCode,
			path: req.path,
			method: req.method
		});
	}

	// Send error response
	const includeStack = process.env.NODE_ENV === 'development';
	const errorResponse = formatErrorResponse(err, includeStack);

	// Don't expose internal error details in production
	if (!isOperational && statusCode >= 500 && process.env.NODE_ENV !== 'development') {
		errorResponse.error = 'Internal server error';
		delete errorResponse.details;
	}

	res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper - wraps async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req, res, next) {
	const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
	next(error);
}

