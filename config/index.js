import dotenv from 'dotenv';
import chalk from 'chalk';
dotenv.config();


const SERVER_ADDRESS = process.env.SERVER_ADDRESS;
const SERVER_PORT = process.env.SERVER_PORT;
const SOCKET_ORIGIN = process.env.SOCKET_ORIGIN;
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
				url: `${SERVER_ADDRESS}:${SERVER_PORT}`
			}
		]
	},
	apis: ['./routes/*.js']
};
const VERBOSE = process.env.VERBOSE === 'true'
if (VERBOSE)
	console.log(chalk.bold.blue(`[${new Date().toISOString()}] <${OPTIONS.definition.info.title}>`), chalk.gray(`VERBOSE environment variable true. Verbose logging enabled.`));
else if (!VERBOSE && process.env.VERBOSE !== 'false')
	console.error(chalk.bold.red(`[${new Date().toISOString()}] <Error>`), chalk.gray(`VERBOSE environment variable unregcognized, setting false`));

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
//		color: 'color | '#hexdecimal',	# color of text after prefix (prefix color cannot be modified)
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
	const log_settings = {
		prefix: OPTIONS.definition.info.title,
		color: 'gray',
	}
	if (typeof args[0] === 'string' && args[0].startsWith('@@')) {
		parse_params(log_settings, args[0]);
		args.shift();	
	} else {
	}
	if (VERBOSE || log_settings.force) console.log(chalk.bold.blue(`[${new Date().toISOString()}] <${log_settings.prefix}>`), chalk_up(log_settings, ...args));
}

function error(...args) {
	const log_settings = {
		prefix: 'Error',
		color: 'red',
	}
	if (typeof args[0] === 'string' && args[0].startsWith('@@')) {
		parse_params(log_settings, args[0]);
		args.shift();	
	} else {
	}
	if (VERBOSE || log_settings.force) console.error(chalk.bold.red(`[${new Date().toISOString()}] <${log_settings.prefix}>`), chalk_up(log_settings, ...args));
}

function log_default(...args) {
	console.log(...args);
}

function error_default(...args) {
	console.error(...args);
}

export default {
	// variables
	SERVER_ADDRESS,
	SERVER_PORT,
	SOCKET_ORIGIN,
	VERBOSE,
	OPTIONS,

	// functions
	log,
	log_default,
	error,
	error_default
}
