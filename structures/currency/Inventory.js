const { Collection } = require('discord.js');

const ItemGroup = require('./ItemGroup');
const Redis = require('../../structures/Redis');
const UserProfile = require('../../models/UserProfile');

setInterval(async () => {
	const inventories = await Redis.db.hgetallAsync('inventory') || {};

	/* eslint-disable no-await-in-loop */
	for (const [userID, contentString] of Object.entries(inventories)) {
		const content = JSON.parse(contentString);

		const [profile, created] = await UserProfile.findCreateFind({
			where: { userID },
			defaults: { inventory: content }
		});

		if (!created) {
			profile.update({ inventory: content });
		}
	}
	/* eslint-enable no-await-in-loop */
}, 30 * 60 * 1000);

module.exports = class Inventory {
	constructor(userID, content) {
		this.userID = userID;
		this._content = content || new Collection();
	}

	addItem(item) {
		const itemGroup = new ItemGroup(item, 1);
		this.addItems(itemGroup);
	}

	addItems(itemGroup) {
		if (this._content.has(itemGroup.item.name)) {
			const { amount: oldAmount } = this._content.get(itemGroup.item.name);
			this._content.set(itemGroup.item.name, new ItemGroup(itemGroup.item, oldAmount + itemGroup.amount));
		} else {
			this._content.set(itemGroup.item.name, itemGroup);
		}
	}

	removeItem(item, deleteAll) {
		const itemGroup = new ItemGroup(item, 1);
		this.removeItems(itemGroup, deleteAll);
	}

	removeItems(itemGroup, deleteAll) {
		const { amount: oldAmount } = this._content.get(itemGroup.item.name);

		if (oldAmount === itemGroup.amount || deleteAll) {
			this._content.delete(itemGroup.item.name);
		} else {
			this._content.set(itemGroup.item.name, new ItemGroup(itemGroup.item, oldAmount - itemGroup.amount));
		}
	}

	hasItem(item) {
		const itemGroup = new ItemGroup(item, 1);
		return this.hasItems(itemGroup);
	}

	hasItems(itemGroup) {
		const { amount } = this._content.get(itemGroup.item.name) || { amount: 0 };
		return amount >= itemGroup.amount;
	}

	getItems() {
		return this._content;
	}

	save() {
		const contentArray = this._content.array();
		return Redis.db.hsetAsync('inventory', this.userID, JSON.stringify(contentArray));
	}

	static async fetchInventory(userID) {
		const contentArray = await Redis.db.hgetAsync('inventory', userID).then(val => JSON.parse(val || '[]'));
		const content = new Collection();

		for (const itemGroup of contentArray) {
			content.set(itemGroup.item.name, itemGroup);
		}

		return new Inventory(userID, content);
	}
};
