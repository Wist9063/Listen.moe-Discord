const { Command } = require('discord.js-commando');

const Currency = require('../../structures/currency/Currency');
const Inventory = require('../../structures/currency/Inventory');
const Store = require('../../structures/currency/Store');

module.exports = class BuyBackgroundCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'buy-background',
			aliases: ['background-buy', 'buy-bg', 'bg-buy'],
			group: 'backgrounds',
			memberName: 'buy',
			description: 'Buy a new background for your profile.',

			args: [
				{
					key: 'name',
					prompt: 'which background do you want to buy?\n',
					type: 'string',
					parse: val => val.toLowerCase()
				}
			]
		});
	}

	async run(msg, { name }) {
		const background = Store.getItem(name);
		if (!background) return msg.reply(`a background with the name **${name}** does not exist.`);

		const balance = await Currency.getBalance(msg.author.id);
		if (balance < background.price) {
			return msg.reply(
				`you don't have enough ${Currency.textPlural} to buy ${name.replace(/(\b\w)/gi, lc => lc.toUpperCase())}.`
			);
		}

		await Currency.removeBalance(msg.author.id, background.price);

		const inventory = await Inventory.fetchInventory(msg.author.id);
		inventory.addItem(background);
		await inventory.save();

		return msg.reply(`you have successfully bought ${name.replace(/(\b\w)/gi, lc => lc.toUpperCase())}.`);
	}
};
