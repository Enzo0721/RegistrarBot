import dotenv from 'dotenv';
import chalk from 'chalk';
dotenv.config();

const env_reqs = {
    SERVER_ADDRESS: { type: 'req' },
    SERVER_PORT: { type: 'req' },
    SOCKET_ORIGIN: { type: 'req' },
    LLM_PORT: { type: 'sug', default: '11434' },
    LLM_MODEL: { type: 'sug', default: 'qwen3' },
    VERBOSE: { type: 'opt', default: false }
};

function parse_params(log_settings, str) {
    const params = str.substring(2).split(';');
    for (const arg of params) {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            log_settings[key] = value;
        } else {
            log_settings[arg] = true;
        }
    }
}

function chalk_up(log_settings, ...args) {
    let styled = chalk;

    if (log_settings.color) {
        if (log_settings.color.startsWith('#')) {
            styled = styled.hex(log_settings.color);
        } else if (chalk[log_settings.color]) {
            styled = styled[log_settings.color];
        }
    }

    if (log_settings.bg) {
        if (log_settings.bg.startsWith('#')) {
            styled = styled.bgHex(log_settings.bg);
        } else {
            const bgMethod = `bg${log_settings.bg[0].toUpperCase()}${log_settings.bg.slice(1)}`;
            if (chalk[bgMethod]) {
                styled = styled[bgMethod];
            }
        }
    }

    const styles = ['bold', 'italic', 'dim', 'underline', 'inverse', 'strikethrough'];
    for (const style of styles) {
        if (log_settings[style]) {
            styled = styled[style];
        }
    }

    return styled(...args);
}

function log(...args) {
    const theme = THEME.STD;
    const log_settings = {
        prefix: theme.prefix,
        color: theme.message_style.color
    };

    if (typeof args[0] === 'string' && args[0].startsWith('@@')) {
        parse_params(log_settings, args[0]);
        args.shift();
        if (ENV.VERBOSE || log_settings.force)
            console.log(
                chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
                chalk_up(log_settings, ...args)
            );
        return;
    }

    if (ENV.VERBOSE)
        console.log(
            chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${theme.prefix}>`),
            chalk_up(theme.message_style, ...args)
        );
}

function warn(...args) {
    const theme = THEME.WARN;
    const log_settings = {
        prefix: theme.prefix,
        color: theme.message_style.color
    };

    if (typeof args[0] === 'string' && args[0].startsWith('@@')) {
        parse_params(log_settings, args[0]);
        args.shift();
        if (ENV.VERBOSE || log_settings.force)
            console.warn(
                chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
                chalk_up(log_settings, ...args)
            );
        return;
    }

    if (ENV.VERBOSE)
        console.warn(
            chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${theme.prefix}>`),
            chalk_up(theme.message_style, ...args)
        );
}

function error(...args) {
    const theme = THEME.ERR;
    const log_settings = {
        prefix: theme.prefix,
        color: theme.message_style.color
    };

    if (typeof args[0] === 'string' && args[0].startsWith('@@')) {
        parse_params(log_settings, args[0]);
        args.shift();
        console.error(
            chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
            chalk_up(log_settings, ...args)
        );
        return;
    }

    console.error(
        chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${theme.prefix}>`),
        chalk_up(theme.message_style, ...args)
    );
}

const ENV = {};

function check_env_vars() {
    const errors = [];
    const warnings = [];

    for (const env_var in env_reqs) {
        const req = env_reqs[env_var];
        const val = process.env[env_var];

        if (req.type === 'req') {
            if (!val) errors.push(env_var);
            else ENV[env_var] = val;
        } else if (req.type === 'sug') {
            if (!val) {
                warnings.push(`${env_var}:${req.default}`);
                ENV[env_var] = req.default;
            } else ENV[env_var] = val;
        } else {
            ENV[env_var] = val ?? req.default;
        }
    }

    if (warnings.length)
        warn(
            '@@force',
            'Following environment variables unset; defaults applied:',
            warnings
        );

    if (errors.length) {
        error('Required environment variables missing:', errors);
        throw new Error('Environment validation failed');
    }
}

function getOptions() {
    return {
        definition: {
            openapi: '3.1.0',
            info: {
                title: 'Registrar Bot',
                version: 'v1.0.0',
                description:
                    'REST and Socket.io application made with Express and documented with Swagger'
            },
            servers: [
                {
                    url: `${ENV.SERVER_ADDRESS}:${ENV.SERVER_PORT}`,
                    description: 'Active runtime server (derived from SERVER_PORT)'
                }
            ]
        },
        apis: ['./src/routes/*.js']
    };
}

const THEME = {
    STD: {
        prefix: 'Registrar Bot',
        prefix_style: { bold: true, color: 'blue' },
        message_style: { color: 'gray' }
    },
    WARN: {
        prefix: 'Warning',
        prefix_style: { bold: true, color: 'yellow' },
        message_style: { color: 'yellow' }
    },
    ERR: {
        prefix: 'Error',
        prefix_style: { bold: true, color: 'red' },
        message_style: { color: 'red' }
    }
};

export default {
    ENV,
    get OPTIONS() {
        return getOptions();
    },
    log,
    warn,
    error,
    check_env_vars
};
