import { createApp } from 'vue';
import App from './components/App.vue';
import { WS } from './services/WebSocket.js';

const url = 'ws://192.168.178.100:8080/websockets';
const socket = new WS( url );

const app = createApp(App);
app.mount('#app');