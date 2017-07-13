const { Command } = require('discord.js-commando');
const fs = require('fs');
const path = require('path');
const request = require('snekfetch');

const Store = require('../../structures/currency/Store');

module.exports = class BackgroundAddCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'background-add',
			aliases: ['add-background', 'bg-add', 'add-bg'],
			group: 'backgrounds',
			memberName: 'add',
			description: 'Add a new background for users to buy.',

			args: [
				{
					key: 'name',
					prompt: 'what should the background be called?\n',
					type: 'string',
					parse: val => val.toLowerCase()
				},
				{
					key: 'price',
					prompt: 'what should the background cost?\n',
					type: 'string'
				},
				{
					key: 'description',
					prompt: 'what description should the background have?\n',
					type: 'string'
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author);
	}

	async run(msg, { name, price, description }) {
		const image = msg.attachments.first();
		if (!image) return msg.reply('please attach an image to use for the background.');

		if (Store.hasItem(name)) return msg.reply(`an item with the name ${name} already exists.`);

		const background = await Store.registerItem({ name, price, type: 'background', data: { description } });

		const filepath = path.join(__dirname, '..', '..', 'assets', 'profile', 'backgrounds', `${background.image}.png`);
		request.get(image.url).pipe(fs.createWriteStream(filepath));

		return msg.reply('successfully added the background');
	}
};
