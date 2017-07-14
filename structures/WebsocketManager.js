const winston = require('winston');
const Websocket = require('ws');

const { WEBSOCKET } = process.env;

module.exports = class WebsocketManager {
	constructor(client) {
		this.client = client;
		this.ws = null;
	}

	connect() {
		if (this.ws) this.ws.removeAllListeners();
		try {
			this.ws = new Websocket(WEBSOCKET);
			winston.info(`[LISTEN.MOE][SHARD: ${this.client.shard.id}]: Connection A-OK!`);
		} catch (error) {
			winston.error(`[LISTEN.MOE][SHARD: ${this.client.shard.id}]: Failed to connect! ${error}`);
			setTimeout(this.connect.bind(this), 5000);
		}

		this.ws.on('message', this.onMessage.bind(this));
		this.ws.on('close', this.onClose.bind(this));
		this.ws.on('error', winston.error);

		this.currentSongGame();
	}

	onMessage(data) {
		try {
			if (!data) return;

			const parsed = JSON.parse(data);
			this.client.radioInfo = {
				songName: parsed.song_name,
				artistName: parsed.artist_name,
				animeName: parsed.anime_name,
				listeners: parsed.listeners,
				requestedBy: parsed.requested_by
			};
			this.currentSongGame();
		} catch (error) {
			winston.error(error);
		}
	}

	onClose() {
		setTimeout(this.connect.bind(this), 5000);
		winston.warn(`[LISTEN.MOE][SHARD: ${this.client.shard.id}]: Connection closed, reconnecting...`);
	}

	currentSongGame() {
		if (!this.client.customStream) {
			let game = 'Loading data...';
			if (Object.keys(this.client.radioInfo).length) {
				game = `${this.client.radioInfo.artistName} - ${this.client.radioInfo.songName}`;
			}
			if (this.client.streaming) this.client.user.setGame(game, 'https://twitch.tv/listen_moe');
			else this.client.user.setGame(game);
		}
	}
};
