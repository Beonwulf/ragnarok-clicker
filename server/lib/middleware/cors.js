import cors from 'cors';
import settings from '../settings.js';


const urlsAllowedToAccess = Object.entries(settings.urls || {}).map(([key, value]) => value) || [];
//urlsAllowedToAccess.push('https://www.example.com');


export const configuration = {
	credentials: true,
	methods: 'GET,PUT,PATCH,POST',
	origin: function (origin, callback) {
		if( !origin || urlsAllowedToAccess.includes(origin) ) {
			callback( null, true );
		}
		else {
			callback( new Error(`${origin} not permitted by CORS policy.`) );
		}
	},
};


export default (req, res, next) => {
	return cors(configuration)(req, res, next);
};