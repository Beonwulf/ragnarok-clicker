import WebSocket, { WebSocketServer } from 'ws';
import queryString from 'query-string';
import * as crypto from 'node:crypto';


class WS {


	static #instance = null;


	static getInstance( $app, $expressServer ) {
		if( this.#instance === null ) {
			this.#instance = new WS( $app, $expressServer );
		}
		return this.#instance;
	}


	#app = null;
	#expressServer = null;
	#ws = null;
	#clients = [];
	#clientOn = {};


	constructor( $app, $expressServer ) {
		this.#app = $app;
		this.#expressServer = $expressServer;
	}


	async update( $channel ) {}


	run() {
		this.#ws = new WebSocketServer({
			noServer: true,
			path: '/websockets'
		});

		this.#expressServer.on( 'upgrade', (request, socket, head) => {
			this.#ws.handleUpgrade(request, socket, head, (websocket) => {
				this.#ws.emit( 'connection', websocket, request );
			});
		});
		this.#ws.on( 'connection', (websocketConnection, connectionRequest) => {
			this.#onConnection( websocketConnection, connectionRequest );
		});
	}


	on( $type, $callback ) {}


	#onConnection( $client, $request ) {
		const [_path, params] = $request?.url?.split( '?' );
		const connectionParams = queryString.parse(params);


		if( !connectionParams.type ) {
			$client.send( JSON.stringify({ error: 'type is required.', type:'error' }) );
			this.#closeClient( $client );
		}
		this.#handshake( $client, connectionParams );
	}


	async #handshake( $client, $params ) {
		const channel = $params.channel;
		const type = $params.type;
		const uuid = crypto.randomUUID();

		$client.userData = {
			client: null,
			type: type,
			channel: channel,
			uuid: uuid
		};

		console.log( 'ws connectionParams', $params );
		//console.log( $request.headers['sec-websocket-key'] );
		this.#initClient( $client, $params );

		$client.send( JSON.stringify({handshake:uuid, user:$client.userData, l:this.#clientOn[channel].overlay.length, test:'test'}) );
	}


	async #initClient( $client, $params ) {
		$client.on( 'error', console.error );
		$client.on( 'close', () => {
			console.log('Client has disconnected!');
			this.#closeClient( $client );
		});

		if( typeof this.#clientOn[$client.userData.channel] === 'undefined' ) {
			this.#clientOn[$client.userData.channel] = {
				overlay: [],
				streamdeck: []
			}
		}
		switch( $client.userData.type ) {
			case 'overlay':
				this.#clientOn[$client.userData.channel].overlay.push( $client );
				this.#app.overlay( $client.userData.channel, $client.userData.uuid );
				break;
			case 'streamdeck':
				const result = await this.#app.db().Users.findOne({ where: { username:$params.channel, uuid:$params.uuid } });
				if( result ) {
					$client.userData.client = new ClientStreamdeck( $client, this.#app, $params.channel, $params.uuid );
				}
				else {
					$client.close();
				}
				break;
			default:
		}
		//console.log( 'clients.lenght', typeof this.#ws.clients );
		//this.#ws.clients.forEach( (client) => { console.log( client.userData ); });
	}


	#removeClient( $client ) {
		if( typeof $client.userData !=='undefined' ) {
			switch( $client.userData.type ) {
				case 'overlay':
					this.#clientOn[$client.userData.channel].overlay = this.#clientOn[$client.userData.channel].overlay.filter( c=> c.userData.uuid !== $client.userData.uuid );
				break;
				case 'streamdeck':
				break;
			}
		}
	}


	#closeClient( $client ) {
		this.#removeClient( $client )

		$client.close();
		if( typeof $client.nextTick ==='function' ) {
			$client.nextTick(() => {
				if( [$client.OPEN, $client.CLOSING].includes($client.readyState) ) {
					// Socket still hangs, hard close
					$client.terminate();
				}
			});
		}
	}


	eventOverlay( $channel, $cmd, $data, $type='cmd' ) {
		if( typeof this.#clientOn[$channel] !== 'undefined' ) {
			const data = { data:$data };
			switch( $type ) {}
		}
		const disconnected = [];
		this.#clientOn[$channel].overlay.forEach(client => {
			if( client.readyState === WebSocket.OPEN ) {
				client.send( JSON.stringify(data) );
			}
			else {
				disconnected.push( client );
			}
		});
		disconnected.forEach(client=>{client.close();});
	}
	
	
	#save() {}


}


export default ( $app, $expressServer ) => {
	return WS.getInstance( $app, $expressServer );
};