const socket = new WebSocket('ws://192.178.168.100:8080');

socket.onopen = () => {
	console.log('Connected to server');
	socket.send('Hello, Server!');
};

socket.onmessage = (event) => {
	console.log(`Message from server: ${event.data}`);
};