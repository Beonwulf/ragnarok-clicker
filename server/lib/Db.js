//import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import logger from './logger.js';


class Database {


	static #instance = null;
	static getInstance() {
		if( this.#instance === null ) {
			this.#instance = new Database();
		}
		return this.#instance;
	}


	#sequelize = null;


	constructor() {/*
		this.#sequelize = new Sequelize('', '', '', {
			host: 'localhost',
			dialect: 'postgres',
		});*/
	}


    async init() {}


}


export const Db = Database.getInstance();


//export const sequelize = Database.getInstance().sequelize;