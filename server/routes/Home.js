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
		if( this.issetCookie( 'JWTragnarokclicker' ) ) {
			await this.user();
		}
		else {
			await this.#stateToken();
			await this.guest();
		}

		const data = {
			ws:'192.168.178.100:8080/websocket'
		};
		this.setdata( 'homeData', JSON.stringify(data) );

		//console.log( this.url );
		console.log( 'signedCookies', this.request.cookies );
	}


	async guest() {
		this.setFile( 'index.html.ejs' );
	}


	async user() {
		const jwt = await this.verifyJWT( this.getCookie( 'JWTragnarokclicker' ) );
		const user = await this.db().Users.findOne({ where: { uuid: jwt.usr } });

		if( user === null ) {
			console.log( 'jwt', jwt);
			this.response.clearCookie( 'JWTragnarokclicker', {path:'/', httpOnly: true, sameSite: 'Lax'} );
			this.guest();
		}
		else {
			//const jwt = this.parseJwt( this.getCookie( 'JWTragnarokclicker' ) );
			console.log( 'Home::user', jwt );
			const expire = 1000 * 60 * 60 * 24 * 30; // 30 days
			const JWTragnarokclicker = this.generateJWT( {usr:user.uuid}, {expiresIn:expire} );
			this.setCookie( 'JWTragnarokclicker', JWTragnarokclicker, {path:'/', httpOnly: true, sameSite: 'Lax', expire:expire} );

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


			const data = {
				username: user.username,
				key: reverse( user.uuid ),
				url: CFG.urls.app,
				ws: `ws:${url.host}/websockets`,
				wss: `wss:${url.host}/websockets`,
			};
			this.setdata( 'homeData', JSON.stringify(data) );
			this.setFile( 'user.html.ejs' );
		}
	}


	async #stateToken() {
		const res = await this.verifyCSRFToken();
		if( res === false ) {
			console.log( 'token expired or invalid!' );
			this.#newCSRFToken();
		}
		await this.#tokenNonceFromJWT();
	}


	#newCSRFToken() {
		this.response.clearCookie( 'state.token', {path:'/', httpOnly: true, sameSite: 'Lax'} );
		const token = this.generateCSRFToken();
		const expire = 300000;
		this.setCookie( 'state.token', token, {path:'/', httpOnly: true, sameSite: 'Lax', expire:expire} );
	}


	async #tokenNonceFromJWT() {
		const res = await this.verifyCSRFToken();

		this.#token = res.token;
		this.#nonce = res.nonce;
	}


}


export default Home;