const { Command, util } = require('discord.js-commando');

const { PAGINATED_ITEMS } = process.env;
const Store = require('../../structures/currency/Store');

module.exports = class StoreInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'background-store',
			aliases: ['bg-store'],
			group: 'backgrounds',
			memberName: 'store',
			description: 'Displays price of all items.',
			display: 'Displays price of all items.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'page',
					prompt: 'which page would you like to view?\n',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	run(msg, { page }) {
		const storeItems = Store.getAll('background').array();
		const paginated = util.paginate(storeItems, page, Math.floor(PAGINATED_ITEMS));
		if (storeItems.length === 0) return msg.reply('can\'t show what we don\'t have, man.');

		return msg.embed({
			title: 'Backgrounds',
			fields: [
				{
					name: 'Item',
					value: paginated.items.map(item => item.name.replace(/(\b\w)/gi, lc => lc.toUpperCase())).join('\n'),
					inline: true
				},
				{
					name: 'Price',
					value: paginated.items.map(item => item.price).join('\n'),
					inline: true
				}
			],
			footer: { text: paginated.maxPage > 1 ? `Use ${msg.usage()} to view a specific page.` : '' }
		});
	}
};
