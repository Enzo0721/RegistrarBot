import config from '#config';
import { increment } from '../metrics/registry.js';

/**
 * Logs incoming HTTP requests
 * Also increments request metrics
 */
export function requestLogger(req, res, next) {
    // 🔹 Increment metrics as soon as request is received
    increment('requests_total');

    if (config.ENV.VERBOSE) {
        config.log(
            `${req.method} ${req.originalUrl} from ${req.ip}`
        );
    }

    next();
}
