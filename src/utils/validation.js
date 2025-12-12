/**
 * Input validation utilities for API endpoints
 */

/**
 * Message role constants for chat messages
 */
export const MESSAGE_ROLES = {
	SYSTEM: 'system',
	USER: 'user',
	ASSISTANT: 'assistant'
};

export const VALID_MESSAGE_ROLES = Object.values(MESSAGE_ROLES);

/**
 * User role constants
 */
export const USER_ROLES = {
	STUDENT: 'student',
	ADMIN: 'admin',
	INSTRUCTOR: 'instructor'
};

export const VALID_USER_ROLES = Object.values(USER_ROLES);

/**
 * Validate message role (for chat messages)
 * @param {string} role - Message role to validate
 * @returns {boolean} True if valid role
 */
export function isValidMessageRole(role) {
	return VALID_MESSAGE_ROLES.includes(role);
}

/**
 * Validate user role
 * @param {string} role - User role to validate
 * @returns {boolean} True if valid role
 */
export function isValidUserRole(role) {
	return VALID_USER_ROLES.includes(role);
}

/**
 * Validate message content
 * @param {string} content - Message content to validate
 * @param {number} maxLength - Maximum allowed length (default: 10000)
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateMessageContent(content, maxLength = 10000) {
	if (!content || typeof content !== 'string') {
		return { valid: false, error: 'Content must be a non-empty string' };
	}
	
	if (content.trim().length === 0) {
		return { valid: false, error: 'Content cannot be empty or whitespace only' };
	}
	
	if (content.length > maxLength) {
		return { valid: false, error: `Content exceeds maximum length of ${maxLength} characters` };
	}
	
	return { valid: true };
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateUsername(username) {
	if (!username || typeof username !== 'string') {
		return { valid: false, error: 'Username must be a non-empty string' };
	}
	
	if (username.trim().length === 0) {
		return { valid: false, error: 'Username cannot be empty or whitespace only' };
	}
	
	if (username.length > 50) {
		return { valid: false, error: 'Username exceeds maximum length of 50 characters' };
	}
	
	// Allow alphanumeric, underscore, hyphen
	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
	}
	
	return { valid: true };
}

/**
 * Validate email format (optional field)
 * @param {string} email - Email to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateEmail(email) {
	if (!email) {
		return { valid: true }; // Email is optional
	}
	
	if (typeof email !== 'string') {
		return { valid: false, error: 'Email must be a string' };
	}
	
	// Basic email regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return { valid: false, error: 'Invalid email format' };
	}
	
	return { valid: true };
}

