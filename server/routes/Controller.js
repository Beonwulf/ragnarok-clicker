import fs from 'fs/promises';
import path from 'path';
import logger from '../lib/logger.js';
import jwt from 'jsonwebtoken';
import CFG from '../lib/settings.js';
import * as crypto from 'node:crypto';


const environment = process.env.NODE_ENV;


const parseManifest = async () => {
	if( environment !== 'production' ) return {};

	const manifestPath = path.join( path.resolve(), 'dist', 'manifest.json' );
	const manifestFile = await fs.readFile( manifestPath );

	console.log( manifestPath );

	return JSON.parse( manifestFile );
};


export class Controller {


	static withParam = false;
	static paramName = null;
	static paramCb = null;
	static methods = ['get'];


	#app = null;
	#data = null;
	#file = null;
	#json = null;
	#next = null;


	constructor( $request, $response, $next=null, $app ) {
		this.request = $request;
		this.response = $response;
		this.#next = $next;
		this.#app = $app;
		this.#data = {
			environment,
			manifest: null,
			title: 'Ragnarök Clicker by Beonwulf',
		};
		this.url = new URL($request.url, `http://${$request.headers.host}`);
	}


	update( $channel ) { this.#app.update( $channel ); }


	db() { return this.#app.db(); }


	log( $type, $msg ) {
		if( typeof logger[$type] === 'function' ) {
			logger[$type]( $msg );
		}
	}


	async init() {
		this.#data.manifest = await parseManifest();	
	}


	get method() { return this.request.method; }


	setParam( $key, $value) {}
	getParam( $key ) {}


	setFile( $value) { this.#file = $value; this.#next = null; }
	setJSON( $json ) { this.#json = $json; this.#next = null; }


	setdata( $key, $value) {
		this.#data[$key] = $value;
	}


	issetCookie( $key ) {
		const to = typeof this.request.cookies[$key];
		return (this.request.cookies[$key] === undefined || to === 'undefined') ? false : true;
	}


	getCookie( $key ) {
		return this.request.cookies[$key];
	}


	/** 
	 * @param {String}			$name 
	 * @param {*}				$value 
	 * @param {String}			$opt.domain		Domain name for the cookie. Defaults to the domain name of the app.
	 * @param {Function}		$opt.encode  	A synchronous function used for cookie value encoding. Defaults to encodeURIComponent.
	 * @param {Date}			$opt.expires 	Expiry date of the cookie in GMT. If not specified or set to 0, creates a session cookie.
	 * @param {Boolean}			$opt.httpOnly 	Flags the cookie to be accessible only by the web server.
	 * @param {Number}			$opt.maxAge  	Convenient option for setting the expiry time relative to the current time in milliseconds.
	 * @param {String}			$opt.path 	 	Path for the cookie. Defaults to “/”.
	 * @param {String}			$opt.priority 	Value of the “Priority” Set-Cookie attribute.
	 * @param {Boolean}			$opt.secure  	Marks the cookie to be used with HTTPS only.
	 * @param {Boolean}			$opt.signed  	Indicates if the cookie should be signed.
	 * @param {Boolean|String}	$opt.sameSite 	Value of the “SameSite” Set-Cookie attribute. More information at https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1.
	 */
	setCookie( $name, $value, $opt={} ) {
		const options = {
			domain: $opt.domain || '.localhost:3000',
			//encode: $opt.encode || encodeURIComponent,
			expires: $opt.expires || 900000,
			httpOnly: $opt.httpOnly || true,
			maxAge: $opt.maxAge || new Date(Date.now() + ($opt.expires || 900000)),
			path: $opt.path || '/',
			//priority: $opt.priority || null,
			secure: $opt.secure || false,
			//signed: $opt.signed || false,
			sameSite: $opt.sameSite || 'Lax'
		};
		//this.response.cookie( $name, $value, options );
		const expiresDefault = 900000; // 1000 * 60 * 15 = 15 min | 1000ms = 1s * 60 = 1min
		this.response.cookie( $name, $value, {
			domain: $opt.domain || this.url.hostname,//'.' + this.url.host,
			path: $opt.path || '/',
			httpOnly: $opt.httpOnly || true,
			expires:new Date(Date.now() + ($opt.expires || expiresDefault)),
			sameSite: $opt.sameSite || 'Lax'
		});
		//console.dir( 'setcookie:', this.getCookie( $name ) );
	}


	parseJwt( token ) {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	
		return JSON.parse(jsonPayload);
	}


	generateCSRFToken() {
		const csrf = {
			token: crypto.randomBytes(24).toString('hex'),
			nonce: crypto.randomUUID(),
		};

		const token = jwt.sign( csrf, CFG.jwtsecret, { expiresIn: '300s' } );

		return token;
	}


	generateJWT( $payload, $opt ) {
		const options = {
			algorithm: 'HS256',
			expiresIn: $opt.expiresIn || '300s'
		};
		const token = jwt.sign( $payload, CFG.jwtsecret, options );
		return token;
	}


	async verifyCSRFToken() {
		const token = this.getCookie( 'state.token' );
		return this.verifyJWT( token );
	}


	async verifyJWT( $jwt ) {
		return jwt.verify( $jwt, CFG.jwtsecret, async (err, decoded) => {
			if( err ) {
				logger.warn(err.message);
				return false;
			}
			else {
				return decoded;
			}
		});
	}


	prepare() {}


	next() {
		if(typeof this.#next==='function') {
			console.log('Controller::next', 'function', this.#next)
			this.#next();
		}
		else if( this.#json !== null ) {
			this.response.json( this.#json );
		}
		else if( this.#file !== null ) {
			this.response.render( this.#file, this.#data );
		}

	}


}