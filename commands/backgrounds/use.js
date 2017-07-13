const { Command } = require('discord.js-commando');

const Store = require('../../structures/currency/Store');
const Inventory = require('../../structures/currency/Inventory');
const UserProfile = require('../../models/UserProfile');

module.exports = class UseBackgroundCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'use-background',
			aliases: ['background-use', 'use-bg', 'bg-use'],
			group: 'backgrounds',
			memberName: 'use',
			description: 'Use a new background for your profile.',

			args: [
				{
					key: 'name',
					prompt: 'which background do you want to use?\n',
					type: 'string',
					parse: val => val.toLowerCase()
				}
			]
		});
	}

	async run(msg, { name }) {
		let background;

		if (name === 'default' || !name) {
			background = { image: 'default' };
		} else {
			background = Store.getItem(name);
			if (!background) {
				return msg.reply(
					`a background with the name **${name.replace(/(\b\w)/gi, lc => lc.toUpperCase())}** does not exist.`
				);
			}

			const inventory = await Inventory.fetchInventory(msg.author.id);
			if (!inventory.hasItem(background)) {
				return msg.reply(
					`you do not own the background **${name.replace(/(\b\w)/gi, lc => lc.toUpperCase())}**`
				);
			}
		}

		const [profile, created] = await UserProfile.findCreateFind({
			where: { userID: msg.author.id },
			defaults: {
				userID: msg.author.id,
				background: background.image
			}
		});
		if (!created) await profile.update({ background: background.image });

		if (name === 'default' || !name) return msg.reply(`you are now using the default background for your profile.`);
		return msg.reply(`you are now using **${name.replace(/(\b\w)/gi, lc => lc.toUpperCase())}** for your profile.`);
	}
};
