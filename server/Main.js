import express from 'express';
import * as path from 'node:path';
import https from 'node:https';
import fs from 'fs';
import logger from './lib/logger.js';
import middleware from './middleware/index.js';
//import assetsRouter from './assetsRouter.js';
import { Db } from './lib/Db.js';
import { Router } from './routes/Router.js';
import websocketServer from './lib/websocket/WS.js';
//import { TwitchBot } from './lib/twitch/Bot.js';
//import CFG from './lib/settings.js';
//import { OBSWebSocket } from './websocket/obs/OBSWebSocket.js';


class MainSingleton {


	static #instance = null;
	static getInstance() {
		if( this.#instance === null ) {
			this.#instance = new MainSingleton();
		}
		return this.#instance;
	}


	#app = null;
	#router = null;
	#server = null;
	#ws = null;
	#db = null;


	constructor() {
		this.#db = Db;
	}


	db() {
		return this.#db;
	}


	startup( $options ) {
		return new Promise((resolve, reject) => {
			this.#startup( $options, { resolve, reject } );
		});
	}


	async run() {
		if( this.#server === null ) {
			await this.#router.run();
			const port = process.env.PORT || 8080;
			this.#app.use( this.#router.middleware );
			/*
			const privateKey  = fs.readFileSync('server/data/selfsigned.key', 'utf8');
			const certificate = fs.readFileSync('server/data/selfsigned.crt', 'utf8');
			const credentials = {key: privateKey, cert: certificate};
			this.#server = https.createServer(credentials, this.#app);
			*/
			this.#server = this.#app.listen(port, () => { logger.success( `Server listening on port ${port}` ); });
			this.#ws = websocketServer( this, this.#server );
			this.#ws.run();
		}
	}


	destroy() {}


	async #startup( $options, { resolve, reject } ) {
		try {
			this.#handleProcessEvents( $options );
			this.#initExpress( $options );
			await this.#db.init();
			
			resolve({app:this, express:this.#app, router:this.#router});
		}
		catch( $exception ) {
			reject( `[startup] ${$exception.message}` );
		}
	}


	#handleProcessEvents() {
		try {
			process.on( 'exit', async () => {
				this.destroy();
			});

			process.on( 'uncaughtException', ( $error ) => {
				logger.error( $error );
				console.warn( $error );
			});
	
			process.on( 'uncaughtException', async ( $error ) => {
				logger.error( $error );
				console.warn( $error );
			});
	
			process.on( 'unhandledRejection', async ( $error ) => {
				logger.error( $error );
				console.warn( $error );
			});
		} catch( $exception ) {
			throw new Error( `[startup.handleProcessEvents] ${$exception.message || $exception}` );
		}
	}


	#initExpress() {
		this.#app = express();
		this.#router = Router( this, express.Router() );

		middleware( this.#app );
	}


}


export const Main = MainSingleton.getInstance();
export default Main;