import fs from 'fs';
import logger from '../lib/logger.js';


class MyRouter {


	static #instance = null;
	static getInstance( $app, $router ) {
		if( this.#instance === null ) {
			this.#instance = new MyRouter( $app, $router );
		}
		return this.#instance;
	}


	#router = null;
	#app = null;
	#methods = ['get', 'post', 'put', 'patch'];


	constructor( $app, $router ) {
		this.#router = $router;
		this.#app = $app;
	}


	get middleware() { return this.#router; }


	async run() {
		const folder = './server/routes/';
		const files = [];
		fs.readdirSync( folder ).forEach(file => {
			if( !['index.js', 'Controller.js', 'Router.js'].includes(file) ) { files.push( file ); }
		});

		const controller = [];
		for( let i=0; i<files.length; i++ ) {
			const modul = await import(`./${files[i]}`);
			const name = files[i].replace('.js', '' );
			if( typeof modul[name] !=='undefined' ) {
				controller.push( modul[name] )
			}
			else if( typeof modul.default !== 'undefined' ) {
				controller.push( modul.default );
			}
		}
		await this.#initroutes( controller );
	}


	async #initroutes( $controller ) {
		for( let i=0; i<$controller.length; i++ ) {
			const controller = $controller[i];
			if( controller.withParam === true ) {
				if( Array.isArray(controller.paramName) ) {
					controller.paramName.forEach( name=>{
						this.param( name, async ( req, res, next, value, key ) => {
							controller.paramCb( req, res, next, value, key );
						});
					});
				}
				else {
					this.param( `${controller.paramName}`, async ( req, res, next, value, key ) => {
						controller.paramCb( req, res, next, value, key );
					});
				}
			}
			const methods = controller.methods;
			for( let i=0; i<methods.length; i++ ) {
				const method = methods[i].toLowerCase();
				this.add( controller.path, method, async (req, res, next, app)=>{
					const route = new controller( req, res, next, app );
					await route.init();
					route.next();
				});
			}
		}
	}


	param( $param, $callback ) {
		this.#router.param( $param, (req, res, next, value) => {
			$callback(req, res, next, value, $param);
		});
	}


	add( $path, $method, $callback ) {
		if( !this.#methods.includes($method) ) {
			logger.warn( `Method ${$method} is not supported!` );
			return;
		}
		switch( $method ) {
			case 'get': this.get( $path, $callback ); break;
			case 'post': this.post( $path, $callback ); break;
			case 'put': this.put( $path, $callback ); break;
			case 'patch': this.patch( $path, $callback ); break;
		}
	}


	get( $path, $callback ) {
		this.#router.get( $path, async ($req, $res, $next) => {
			$callback( $req, $res, $next, this.#app );
		});
	}


	post( $path, $callback ) {
		this.#router.post( $path, async ($req, $res, $next) => {
			$callback( $req, $res, $next, this.#app );
		});
	}


	put( $path, $callback ) {
		this.#router.put( $path, async ($req, $res, $next) => {
			$callback( $req, $res, $next, this.#app );
		});
	}


	patch( $path, $callback ) {
		this.#router.patch( $path, async ($req, $res, $next) => {
			$callback( $req, $res, $next, this.#app );
		});
	}


	destroy() {}


}


export const Router = (app, router) => { return MyRouter.getInstance( app, router ); };