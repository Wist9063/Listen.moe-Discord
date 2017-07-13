const { Collection } = require('discord.js');

const Item = require('./Item');
const ItemModel = require('../../models/Item');
const BackgroundItem = require('./BackgroundItem');

const background = new Collection();
const none = new Collection();

class Store {
	static get stores() {
		return {
			background,
			none
		};
	}

	static async registerItem({ name, price, type, data }) {
		await ItemModel.create({
			name,
			price,
			type,
			data
		});

		return this.addItem({ name, price, type, data });
	}

	static addItem({ name, price, type, data }) {
		let item;

		if (type === 'background') item = new BackgroundItem(name, price, data);
		else item = new Item(name, price, data);

		Store.stores[item.type].set(item.name, item);
		return item;
	}

	static hasItem(item, type) {
		const name = item instanceof Item
			? item.name
			: item;

		if (!type) {
			for (const store of Object.values(Store.stores)) {
				if (store.has(name)) return true;
			}

			return false;
		} else {
			return (type in Store.stores) && Store.stores[type].has(name);
		}
	}

	static getItem(name, type) {
		if (!type) {
			for (const store of Object.values(Store.stores)) {
				if (store.has(name)) return store.get(name);
			}

			return undefined;
		} else {
			return type in Store.stores ? Store.stores[type].get(name) : undefined;
		}
	}

	static getAll(type) {
		return type in Store.stores ? Store.stores[type] : undefined;
	}

	static async removeItem(item) {
		item = item instanceof Item ? item : Store.getItem(item);
		if (!Store.hasItem(item)) return;

		await ItemModel.destroy({ where: { name: item.name } });
		Store.stores[item.type].delete(item.name);
	}
}

ItemModel.findAll().then(items => {
	for (const item of items) Store.addItem(item);
});

module.exports = Store;
