import chalk from 'chalk';


const levels = {
	debug: 0,
	error: 1,
	warn: 2,
	success: 3,
	info: 3,
	log: 3,
	none: 4,
};


class Logger {


	static #instance = null;


	static getInstance() {
		if( this.#instance === null ) {
			this.#instance = new Logger();
		}
		return this.#instance;
	}


	#level = 'error';
	#loglevel = 1;
	#rootPath = null;


	constructor() {
		const root = import.meta.url.replace(process.cwd(), '');//.split('/');
		this.#rootPath = import.meta.url.replace('/lib/logger.js', '');
	}


	setLevel( $lvl ) {
		$lvl = $lvl.toLowerCase();
		if( Object.keys(levels).includes( $lvl) ) {
			this.#level = $lvl;
			this.#loglevel = levels[$lvl];
		}
	}


	log( $message='' ) {
		if( $message ) {
			this.#log( $message, 'log' );
		}
	}


	info( $message ) {
		this.#log(chalk.blue(this.#getErrorMessage($message)), 'info' );
		this.externalHandler($message);
	}


	success( $message ) {
		this.#log(chalk.green(this.#getErrorMessage($message)), 'success');
		this.externalHandler($message);
	}


	warn( $message ) {
		this.#log(chalk.yellow(this.#getErrorMessage($message)), 'warn');
		this.externalHandler($message);
	}


	error( $error ) {
		this.#log(chalk.red(this.#getErrorMessage($error)), 'error' );
		this.externalHandler($error);
	}


	externalHandler( $message, $time, $file ) {
		// NOTE: Implement calls to third-party logging services here.
	}


	isErrorObject( $value ) {
		return $value && $value instanceof Error;
	}


	#log( $message='', $lvl='none' ) {
		if( levels[$lvl] >= this.#loglevel ) {
			const time = this.#time();
			const timeFormated = this.#dateFormatted( time, $lvl );
			const {fn, file, line, column} = this.#getFileLine();
			const caller = ((fn) ? fn + ' ' + file : file) + ` ${line}:${column}`;
			const infoString = this.#coloredString( timeFormated + ' ' + caller, $lvl )
			console.log( infoString, '\n', `${timeFormated} ${$message}` );
			this.externalHandler( $message, time, caller );
		}
	}


	#getErrorMessage( $value ) {
		const isErrorObject = this.isErrorObject( $value );

		if( isErrorObject ) {
			return $value?.message || $value?.reason || $value;
		}

		return $value;
	}


	#time() {
		// Format the dates
		const date = new Date();
		const h = date.getHours();
		const m = date.getMinutes();
		return `${(h < 10 ? '0' : '') + h}:${(m < 10 ? '0' : '') + m}`;
	}


	#dateFormatted( $time, $lvl=null ) {
		let cb = chalk.inverse.bold;

		switch( $lvl ) {
			case 'debug': cb = chalk.inverse.bold; break;
			case 'error': cb = chalk.inverse.bold.red; break;
			case 'warn': cb = chalk.inverse.bold; break;
			case 'success': cb = chalk.inverse.bold.green; break;
			case 'info': cb = chalk.inverse.bold.blue; break;
			case 'log': cb = chalk.inverse.bold; break;
			case 'none': break;
		}

		return cb(`[${$time}]`);
	}


	#coloredString( $string, $lvl ) {
		let cb = chalk.inverse.bold;

		switch( $lvl ) {
			case 'debug': cb = chalk.inverse.bold; break;
			case 'error': cb = chalk.inverse.bold.red; break;
			case 'warn': cb = chalk.inverse.bold; break;
			case 'success': cb = chalk.inverse.bold.green; break;
			case 'info': cb = chalk.inverse.bold.blue; break;
			case 'log': cb = chalk.inverse.bold; break;
			case 'none': break;
		}
		return cb(`${$string}`);
	}


	#getFileLine( $file=null, $line=null ) {
		const result = {fn:null, file:$file, line:$line, column:null };

		const originalPrepareStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = (_, stack) => stack;
		const caller = new Error().stack[3];
		Error.prepareStackTrace = originalPrepareStackTrace;

		result.fn = (caller.getTypeName()) ? caller.getTypeName() + '::' + caller.getFunctionName() : caller.getFunctionName();
		result.file = ($file!==null) ? $file : caller.getFileName();
		result.line = caller.getLineNumber();
		result.column = caller.getColumnNumber();
		result.file = result.file.replace( this.#rootPath, '~root' );

		//console.log( 'process.cwd()', process.cwd());
		//console.log( 'getTypeName', caller.getTypeName() )
		//console.log( 'result', result );

		return result;
	}


}


export default Logger.getInstance();