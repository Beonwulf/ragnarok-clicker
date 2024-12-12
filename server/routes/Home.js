import { Controller } from './Controller.js';
import CFG from '../lib/settings.js';

function reverse(s){
	return [...s].reverse().join("");
}


export class Home extends Controller {


	static path = '/';


	#token = null;
	#nonce = null;


	async init() {
		await super.init();
		if( this.issetCookie( 'JWTtwitch' ) ) {
			await this.user();
		}
		else {
			await this.#stateToken();
			await this.guest();
		}


		

		const twitch = {
			name: CFG.twitch.botname,
			id: CFG.twitch['Client-ID'],
			redirectUrl: CFG.urls.app,
			authUrl: CFG.twitch.authUrl,
			token: this.#token,
			nonce: this.#nonce
		};
		this.setdata( 'twitchClientId', JSON.stringify(twitch) );

		//console.log( this.url );
		console.log( 'signedCookies', this.request.cookies );
	}


	async guest() {
		if( this.url.searchParams.has('code') && this.url.searchParams.has('state') ) {
			await this.#code( this.url.searchParams.get('code'), this.url.searchParams.get('state'), this.url.searchParams.get('scope') );
		}
		this.setFile( 'index.html.ejs' );
	}


	async user() {
		const jwt = await this.verifyJWT( this.getCookie( 'JWTtwitch' ) );
		const user = await this.db().Users.findOne({ where: { uuid: jwt.usr } });

		if( user === null ) {
			console.log( 'jwt', jwt);
			this.response.clearCookie( 'JWTtwitch', {path:'/', httpOnly: true, sameSite: 'Lax'} );
			this.guest();
		}
		else {
			//const jwt = this.parseJwt( this.getCookie( 'JWTtwitch' ) );
			console.log( 'Home::user', jwt );
			const expire = 1000 * 60 * 60 * 24 * 30; // 30 days
			const JWTtwitch = this.generateJWT( {usr:user.uuid}, {expiresIn:expire} );
			this.setCookie( 'JWTtwitch', JWTtwitch, {path:'/', httpOnly: true, sameSite: 'Lax', expire:expire} );

			this.response.redirect(`/crud/${user.username}/${reverse(user.uuid)}`);

			this.setdata('twitchUsr', user.username );
			const url = new URL( CFG.urls.app );
			const dbInsert = this.db().getDefault( 'ChannelConfig' );
			const [chancfg, created] = await this.db().ChannelConfig.findOrCreate({where:{uuid:user.uuid}, defaults: dbInsert});

			if( created ) {
				chancfg.set( dbInsert );
				await chancfg.save();
			}
			else {
				let update = false;
				for( const [col, value] of Object.entries(dbInsert) ) {
					for( const [key, val] of Object.entries(value)) {
						if( typeof chancfg[col][key] ==='undefined' ) {
							update = true;
							chancfg[col][key] = val;
						}
					}
				}
				if( update === true ) {
					await chancfg.save();
				}
			}


			const twitch = {
				username: user.username,
				key: reverse( user.uuid ),
				url: CFG.urls.app,
				ws: `ws:${url.host}/websockets`,
				wss: `wss:${url.host}/websockets`,
				scopes: user.scope,
				chancfg:{
					chatcommands: chancfg.chatcommands,
					actionpanel: chancfg.actionpanel,
					badwords: chancfg.badwords,
					alerts: chancfg.alerts,
					overlay: chancfg.overlay,
				}
			};
			this.setdata( 'twitchUser', JSON.stringify(twitch) );
			this.setFile( 'user.html.ejs' );
		}
	}


	async #code( $code, $state, $scope ) {
		//curl -X POST 'https://id.twitch.tv/oauth2/token' \
		//-H 'Content-Type: application/x-www-form-urlencoded' \
		//-d 'client_id=<your client id goes here>&client_secret=<your client secret goes here>&code=17038swieks1jh1hwcdr36hekyui&grant_type=authorization_code&redirect_uri=http://localhost:3000'
		if( $state === this.#token ) {
			console.log( 'state ok', $code);
		}
		else {
			console.log( 'state not ok');
			return;
		}
		const data = new URLSearchParams();
		data.append( 'client_id', CFG.twitch['Client-ID'] );
		data.append( 'client_secret', CFG.twitch['Client-Secret'] );
		data.append( 'code', $code );
		//data.append( '', value );
		//data.append( '', value );
		data.append( 'redirect_uri', CFG.urls.app );
		data.append( 'grant_type', 'authorization_code' );
		const options = {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: data.toString(),
			json: true
		};
		const result = await fetch( CFG.twitch.oauth2Token, options );
		if( result.status === 200 ) {
			const data = await result.json();
			const jwt = this.parseJwt( data.id_token );
			console.log( data, jwt );
			const dbInsert = {
				accessToken: data.access_token,
				idToken: data.id_token,
				nonce: data.nonce,
				refreshToken: data.refresh_token,
				tokenType: data.token_type,
				scope: JSON.stringify(data.scope)
			};
			const [user, created] = await this.db().Users.findOrCreate({
				where: { username: jwt.preferred_username },
				defaults: dbInsert
			});
			if( created ) {
				user.set( dbInsert );
				await user.save();
			}
			else {}
			
			const expire = 1000 * 60 * 60 * 24 * 30; // 30 days
			const JWTtwitch = this.generateJWT( {usr:user.uuid}, {expiresIn:expire} );
			this.setCookie( 'JWTtwitch', JWTtwitch, {path:'/', httpOnly: true, sameSite: 'Lax', expire:expire} );
			this.response.redirect( CFG.urls.app );
		}
		else {
			const data = await result.json();
			console.log( data, '\n', options.body );
		}
	}


	async #stateToken() {
		const res = await this.verifyCSRFToken();
		if( res === false ) {
			console.log( 'token expired or invalid!' );
			this.#newCSRFToken();
		}
		await this.#tokenNaonceFromJWT();
	}


	#newCSRFToken() {
		this.response.clearCookie( 'state.token', {path:'/', httpOnly: true, sameSite: 'Lax'} );
		const token = this.generateCSRFToken();
		const expire = 300000;
		this.setCookie( 'state.token', token, {path:'/', httpOnly: true, sameSite: 'Lax', expire:expire} );
	}


	async #tokenNaonceFromJWT() {
		const res = await this.verifyCSRFToken();

		this.#token = res.token;
		this.#nonce = res.nonce;
	}


}


export default Home;