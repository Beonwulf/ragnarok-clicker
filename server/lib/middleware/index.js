import * as path from 'node:path';
import requestMethods from './requestMethods.js';
import compression from 'compression';
import favicon from 'serve-favicon';
import express from 'express';
import cors from './cors.js';
import bodyParser from './bodyParser.js';
import cookieParser from 'cookie-parser';


export default (app) => {
	//app.use( helmet( helmetOption ) );
	app.use( requestMethods );
	app.use( compression() );
	app.use( favicon('public/favicon.ico') );
	//app.use( express.static('public') );
	app.use( '/', express.static(path.join(process.cwd(), './public')) );
	app.use( cors );
	app.use( bodyParser );
	app.use( cookieParser() );
};