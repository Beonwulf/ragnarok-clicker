import cors from 'cors';
import settings from '../lib/settings.js';


const urlsAllowedToAccess = Object.entries(settings.urls || {}).map(([key, value]) => value) || [];
//urlsAllowedToAccess.push('https://clips.twitch.tv');


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