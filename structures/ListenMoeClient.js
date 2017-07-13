const { CommandoClient } = require('discord.js-commando');

const WebsocketManager = require('./WebsocketManager');
const Database = require('./PostgreSQL');
const Redis = require('./Redis');

module.exports = class ListenMoeClient extends CommandoClient {
	constructor(options) {
		super(options);
		this.radioInfo = {};
		this.customStream = false;

		this.websocketManager = new WebsocketManager(this);
		this.database = Database.db;
		this.redis = Redis.db;

		Database.start();
		Redis.start();
	}
};
