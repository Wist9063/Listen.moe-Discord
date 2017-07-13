const { Command } = require('discord.js-commando');

const Inventory = require('../../structures/currency/Inventory');

module.exports = class BackgroundShowCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'backgrounds-show',
			aliases: ['bg-show', 'show-backgrounds', 'show-bg'],
			group: 'backgrounds',
			memberName: 'show',
			description: 'Show all backgrounds a user owns.',

			args: [
				{
					key: 'user',
					prompt: 'whose backgrounds would you like to view?\n',
					type: 'user',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.user || msg.author;

		const inventory = await Inventory.fetchInventory(user.id);

		const backgrounds = inventory.getItems().filter(itemGroup => itemGroup.item.type === 'background');

		msg.embed({
			title: `${user.username}'s backgrounds:`,
			description: backgrounds.size ? backgrounds.keyArray().join(', ') : 'Can\'t show what you don\'t have.'
		});
	}
};
