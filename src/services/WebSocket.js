export class WS {


	#socket = null;
	#handler = {
		onopen: null,
		onmessage: null,
		onerror: null,
		onclose: null
	};


	constructor( $url ) {
		this.#handler.onopen = this.#onopen;
		this.#handler.onmessage = this.#onmessage;
		this.#handler.onerror = this.#onerror;
		this.#handler.onclose = this.#onclose;

		this.#socket = new WebSocket( $url );
		console.log( $url )

		this.#socket.onopen = this.#handler.onopen;
		this.#socket.onmessage = this.#handler.onmessage;
		this.#socket.onerror = this.#handler.onerror;
		this.#socket.onclose = this.#handler.onclose;
	}


	#onopen( $event ) {
		console.log( 'WebSocket connection opened:', $event );
	}


	#onmessage( $event ) {
		console.log( 'WebSocket message received:', $event.value );
	}


	#onerror( $error ) {
		console.log( 'WebSocket error:', $error );
	}


	#onclose( $event ) {
		console.log( 'WebSocket connection closed:', $event.code );
	}


	sendMessage( $username, $text ) {
		const messageData = { username: $username, message: $text };
		// Send the message data to the server using WebSockets
		this.#socket.send( JSON.stringify(messageData) );
		// Add the message data to the messages array
		//messages.value.push(messageData);
	}


}