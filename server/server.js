import logger from './lib/logger.js';
import App from './Main.js';


App.startup().then((data) => {
	/*console.log( 'App::startup', data );*/
	data.router.get( '/api/v1/hello', (_req, res) => { res.json({ message: 'Hello, world!' }); });
	data.app.run();
}).catch(( $error ) => {
	logger.error( $error );
});