import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();


class CFG {


	static #instance = null;
	static getInstance() {
		if( this.#instance === null ) {
			this.#instance = new CFG();
		}
		return this.#instance;
	}


	#data = {};


	constructor() {
		const common = JSON.parse( fs.readFileSync(`config/settings-common.json`, 'utf-8' ) );
		const nodeEnv = JSON.parse( fs.readFileSync(`config/settings-${process.env.NODE_ENV}.json`, 'utf-8' ) );

		Object.assign( this.#data, common, nodeEnv );
		
		/*
		const DB = {
			db:{
				host: process.env.DB_HOST,
				port: process.env.DB_PORT,
				dbname: process.env.DB_NAME,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD
			}
		};
		Object.assign( this.#data, DB );*/
	}


	//get db() { return this.#data.db; }


	get urls() { return this.#data.urls; }


}

export default CFG.getInstance();
//export default JSON.parse( process.env.APP_SETTINGS || fs.readFileSync(`config/settings-${process.env.NODE_ENV}.json`, "utf-8") || "{}" );