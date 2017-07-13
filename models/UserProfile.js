const Sequelize = require('sequelize');

const Database = require('../structures/PostgreSQL');

const UserProfile = Database.db.define('userProfiles', {
	userID: {
		type: Sequelize.STRING,
		primaryKey: true,
		unique: true
	},
	inventory: {
		type: Sequelize.JSONB,
		defaultValue: []
	},
	money: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	balance: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	networth: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	experience: {
		type: Sequelize.BIGINT(), // eslint-disable-line new-cap
		defaultValue: 0
	},
	personalMessage: {
		type: Sequelize.STRING,
		defaultValue: ''
	},
	background: {
		type: Sequelize.STRING,
		defaultValue: 'default'
	}
});

module.exports = UserProfile;
