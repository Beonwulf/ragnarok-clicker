import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import logger from './logger.js';
import dotenv from 'dotenv';


dotenv.config();


class Database {


	static #instance = null;
	static getInstance() {
		if( this.#instance === null ) {
			this.#instance = new Database();
		}
		return this.#instance;
	}


	#sequelize = null;


	constructor() {
		this.#sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
			host: process.env.DB_HOST,
			dialect: 'postgres',
		});
	}


    async init() {}


}


export const Db = Database.getInstance();


//export const sequelize = Database.getInstance().sequelize;