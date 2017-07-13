const { Command } = require('discord.js-commando');
const path = require('path');

const Store = require('../../structures/currency/Store');
const Currency = require('../../structures/currency/Currency');

module.exports = class BackgroundInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'background-info',
			aliases: ['bg-info', 'info-background', 'info-bg'],
			group: 'backgrounds',
			memberName: 'info',
			description: 'Display information about a background.',

			args: [
				{
					key: 'name',
					prompt: 'what background do you want information on?\n',
					type: 'string',
					parse: val => val.toLowerCase()
				}
			]
		});
	}

	run(msg, { name }) {
		const background = Store.getItem(name);
		if (!background) return msg.reply(`a background with the name **${name}** does not exist.`);

		const filepath = path.join(__dirname, '..', '..', 'assets', 'profile', 'backgrounds', `${background.image}.png`);

		return msg.say({
			embed: {
				title: `${background.name.replace(/(\b\w)/gi, lc => lc.toUpperCase())} (${Currency.convert(background.price)})`,
				description: background.description,
				image: { url: `attachment://${background.image}.png` }
			},
			files: [
				{
					attachment: filepath,
					name: `${background.image}.png`
				}
			]
		});
	}
};
