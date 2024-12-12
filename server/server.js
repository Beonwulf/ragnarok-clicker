import logger from './lib/logger.js';
import App from './Main.js';

import express from 'express';
import { createServer } from 'http';
import path, { dirname }  from 'path';
import { fileURLToPath } from 'url';
import WebSocket, { WebSocketServer } from 'ws';


const __dirname = dirname(fileURLToPath(import.meta.url));


const app = express();
const server = createServer(app);
//const wss = new WebSocket.Server({ server });
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
	console.log('Client connected');
	ws.on('message', (message) => {
		console.log(`Received: ${message}`);
		ws.send(`Server received: ${message}`);
	});
});

server.listen(8080, () => {
	console.log('Server listening on port 8080');
	logger.info('Server listening on port 8080');
});