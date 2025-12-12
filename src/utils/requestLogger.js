import config from '#config';

/**
 * Request logging middleware
 * Logs all API requests with method, path, IP, response time, and status code
 */

export function requestLogger(req, res, next) {
	const startTime = Date.now();
	const method = req.method;
	const path = req.path;
	const ip = req.ip || req.connection.remoteAddress || 'unknown';
	
	// Log request start
	// config.log(`→ ${method} ${path} from ${ip}`);

	res.on('finish', () => {
		const duration = Date.now() - startTime;
		const statusCode = res.statusCode;
		
		// different color based on status
		let statusColor = 'gray';
		if (statusCode >= 500) {
			statusColor = 'red';
		} else if (statusCode >= 400) {
			statusColor = 'yellow';
		} else if (statusCode >= 200 && statusCode < 300) {
			statusColor = 'green';
		}

		config.log(`@@force;color=${statusColor}`, 
			`${method} ${path} | ${statusCode} | ${duration}ms | ${ip}`
		);
	});

	next();
}

