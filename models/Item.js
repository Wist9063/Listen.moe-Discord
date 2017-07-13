const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const Item = Database.db.define('items', {
	name: {
		type: Sequelize.STRING,
		primaryKey: true,
		unique: true
	},
	price: Sequelize.BIGINT(), // eslint-disable-line new-cap
	type: Sequelize.STRING,
	data: Sequelize.JSONB
});

module.exports = Item;
