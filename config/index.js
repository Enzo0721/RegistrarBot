import dotenv from 'dotenv';
import chalk from 'chalk';
dotenv.config();

const env_reqs = { // sug == suggested, opt == optional, req == required
	SERVER_ADDRESS: {type: 'req'},
	SERVER_PORT: {type: 'req'},
	SOCKET_ORIGIN: {type: 'req'},
	LLM_PORT: {type: 'sug'},
	LLM_MODEL: {type: 'sug', default: 'qwen3'},
	VERBOSE: {type: 'opt', default: false}
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

  // Handle text color
  if (log_settings.color) {
    if (log_settings.color.startsWith('#')) {
      // Use hex color
      styled = styled.hex(log_settings.color);
    } else if (chalk[log_settings.color]) {
      // Use named color if supported by chalk
      styled = styled[log_settings.color];
    }
  }

  // Handle background color
  if (log_settings.bg) {
    if (log_settings.bg.startsWith('#')) {
      styled = styled.bgHex(log_settings.bg);
    } else {
      // Convert "red" -> "bgRed"
      const bgMethod = `bg${log_settings.bg[0].toUpperCase()}${log_settings.bg.slice(1)}`;
      if (chalk[bgMethod]) {
        styled = styled[bgMethod];
      }
    }
  }

  // Handle styles
  const styles = ['bold', 'italic', 'dim', 'underline', 'inverse', 'strikethrough'];
  for (const style of styles) {
    if (log_settings[style]) {
      styled = styled[style];
    }
  }

  return styled(...args);
}

// options
//		prefix: 'text',					# text to be displayed after time
//		color: 'color' | '#hexdecimal',	# color of text after prefix (prefix color cannot be modified)
//		bg: 'color' | '#hexdecimal',	# text background color
//		force,							# log regardless of verbose state
//		bold,							# text is bold or not
//		italic,							# text is italic or not
//		dim,							# dim is ? or not
//		italic,							# text is italic or not
//		underline,						# text is underline or not
//		inverse,						# text is inverse ? or not
//		strikethrough					# text is strikethrough or not
function log(...args) {
	const theme = THEME.STD;
	const log_settings = {
		prefix: theme.prefix,
		color: theme.message_style.color
	};
	if (typeof args[0] === 'string' && args[0].startsWith('@@')) {
		parse_params(log_settings, args[0]);
		args.shift();
		if (ENV.VERBOSE || log_settings.force) console.log(chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
				chalk_up(log_settings, ...args));
		return;
	}
	if (ENV.VERBOSE) console.log(chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
			chalk_up(theme.message_style, ...args));
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
		if (ENV.VERBOSE || log_settings.force) console.warn(chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
				chalk_up(log_settings, ...args));
		return;
	}
	if (ENV.VERBOSE) console.warn(chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${theme.prefix}>`),
			chalk_up(theme.message_style, ...args));
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
		console.error(chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${log_settings.prefix}>`),
				chalk_up(log_settings, ...args));
		return
	}
	console.error(chalk_up(theme.prefix_style, `[${new Date().toISOString()}] <${theme.prefix}>`),
			chalk_up(theme.message_style, ...args));
}

function log_default(...args) {
	console.log(...args);
}

function warn_default(...args) {
	console.warn(...args);
}

function error_default(...args) {
	console.error(...args);
}

const ENV = {};

function check_env_vars() {
	var errors = [];
	var warnings = [];
	for (const env_var in env_reqs) {
		switch(env_reqs[env_var].type) {
		case 'req':
			if ( process.env[env_var] == '' || !process.env[env_var] ) {
				errors.push(env_var);
				break;
			} else {
				ENV[env_var] = process.env[env_var];
			}
		case 'sug':
			if ( process.env[env_var] == '' || !process.env[env_var] ) {
				let val = env_reqs[env_var].default;
				warnings.push(`${env_var}:${val}`);
				ENV[env_var] = env_reqs[env_var].default;
			} else {
				ENV[env_var] = process.env[env_var];
			}
		case 'opt':
		default:
			if ( process.env[env_var] == '' || !process.env[env_var] ) {
				ENV[env_var] = env_reqs[env_var].default;
			} else {
				ENV[env_var] = process.env[env_var];
			}
		}
	}
	if (warnings.length !== 0) {
		warn('@@force', 'Following environment variables unset may cause unexpected behavior, suggested to be set',
				warnings);
	}
	if (errors.length !== 0) {
		error('Following environment variables required and unset please set them in your .env',
				errors);
		throw new Error(`Required environment variables unset`);
	}
}

const OPTIONS = { // options for sever description in sqagger
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
				url: `${ENV.SERVER_ADDRESS}:${ENV.SERVER_PORT}`
			}
		]
	},
	apis: ['./routes/*.js']
};

const THEME = {
	STD: {
		prefix: 'Registrar Bot',
		prefix_style: {
			bold: true,
			color: 'blue'
		},
		message_style: {
			color: 'gray',
		}
	},
	WARN: {
		prefix: 'Warning',
		prefix_style: {
			bold: true,
			color: 'yellow'
		},
		message_style: {
			color: 'yellow',
		}
	},
	ERR: {
		prefix: 'Error',
		prefix_style: {
			bold: true,
			color: 'red'
		},
		message_style: {
			color: 'red',
		}
	}
};

export default {
	// vars
	ENV,
	OPTIONS,

	// functions
	log,
	log_default,
	warn,
	warn_default,
	error,
	error_default,
	check_env_vars

	// variables DEPRECATED
/*	SERVER_ADDRESS,
	SERVER_PORT,
	SOCKET_ORIGIN,
	LLM_PORT,
	LLM_MODEL,
	VERBOSE,
	OPTIONS,

	// functions
	log,
	log_default,
	error,
	error_default,
	check_env_vars*/
}
