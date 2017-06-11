const { FriendlyError } = require('discord.js-commando');
const { oneLine, stripIndents } = require('common-tags');
const path = require('path');
const winston = require('winston');
require('moment-duration-format');

const { COMMAND_PREFIX, OWNERS, RADIO_CHANNELS, STREAM } = process.env;
const ListenMoeClient = require('./structures/ListenMoeClient');
const SequelizeProvider = require('./providers/Sequelize');

const client = new ListenMoeClient({
	owner: OWNERS.split(','),
	commandPrefix: COMMAND_PREFIX,
	unknownCommandResponse: false,
	disableEveryone: true,
	stream: STREAM
});

const Currency = require('./structures/currency/Currency');
const Experience = require('./structures/currency/Experience');

let earnedRecently = [];
let gainedXPRecently = [];

client.dispatcher.addInhibitor(msg => {
	if (!msg.guild) return false;
	const ignoredChannels = msg.guild.settings.get('ignoredChannels', []);
	return ignoredChannels.includes(msg.channel.id);
});

client.dispatcher.addInhibitor(msg => {
	const blacklist = client.provider.get('global', 'userBlacklist', []);
	if (!blacklist.includes(msg.author.id)) return false;
	return `[DISCORD][SHARD: ${client.shard.id}]: ${msg.author.tag} (${msg.author.id}) has been blacklisted.`;
});

/*client.dispatcher.addInhibitor(msg => {
	if (!msg.command) return false;
	const isRestrictedCommand = ['social', 'economy', 'games', 'backgrounds'].includes(msg.command.group.id);
	if ((msg.channel.type === 'dm' || msg.guild.id !== '216372140046286849') && isRestrictedCommand) {
		return [
			`[DISCORD][SHARD: ${client.shard.id}]: ${msg.author.tag} tried to use command from group ${msg.command.group.name}`, // eslint-disable-line max-len
			msg.reply('The command you were trying to use is only available on the official Listen.moe server.')
		];
	}
	return false;
});*/

client.setProvider(new SequelizeProvider(client.database));

client.on('error', winston.error)
	.on('warn', winston.warn)
	.once('ready', () => {
		client.websocketManager.connect();
		Currency.leaderboard();
	})
	.on('ready', () => {
		winston.info(oneLine`
			[DISCORD][SHARD: ${client.shard.id}]: Client ready...
			Logged in as ${client.user.tag}
			(${client.user.id})
		`);
		for (const channel of RADIO_CHANNELS.split(',')) {
			if (!client.guilds.has(channel)) continue;
			const voiceChannel = client.guilds.get(channel);
			client.voiceManager.joinVoice(voiceChannel);
		}
	})
	.on('message', async message => {
		if (message.channel.type === 'dm') return;
		if (message.author.bot) return;
		if (message.guild.id !== '216372140046286849') return;

		const channelLocks = client.provider.get(message.guild.id, 'locks', []);
		if (channelLocks.includes(message.channel.id)) return;
		if (!earnedRecently.includes(message.author.id)) {
			const hasImageAttachment = message.attachments.some(attachment =>
				attachment.url.match(/\.(png|jpg|jpeg|gif|webp)$/)
			);
			const moneyEarned = hasImageAttachment
				? Math.ceil(Math.random() * 2) + 4
				: Math.ceil(Math.random() * 2) + 2;

			Currency._changeBalance(message.author.id, moneyEarned);

			earnedRecently.push(message.author.id);
			setTimeout(() => {
				const index = earnedRecently.indexOf(message.author.id);
				earnedRecently.splice(index, 1);
			}, 8000);
		}

		if (!gainedXPRecently.includes(message.author.id)) {
			const xpEarned = Math.ceil(Math.random() * 9) + 3;
			const oldLevel = await Experience.getLevel(message.author.id);

			Experience.addExperience(message.author.id, xpEarned).then(async () => {
				const newLevel = await Experience.getLevel(message.author.id);
				if (newLevel > oldLevel) {
					Currency._changeBalance(message.author.id, 100 * newLevel);
				}
			}).catch(err => null); // eslint-disable-line no-unused-vars, handle-callback-err

			gainedXPRecently.push(message.author.id);
			setTimeout(() => {
				const index = gainedXPRecently.indexOf(message.author.id);
				gainedXPRecently.splice(index, 1);
			}, 60 * 1000);
		}
	})
	.on('disconnect', () => winston.warn(`[DISCORD][SHARD: ${client.shard.id}]: Disconnected!`))
	.on('reconnect', () => winston.warn(`[DISCORD][SHARD: ${client.shard.id}]: Reconnecting...`))
	.on('guildCreate', guild =>
		/* eslint-disable max-len */
		guild.defaultChannel.send({
			embed: {
				description: stripIndents`**LISTEN.moe discord bot by Crawl & vzwGrey**
				**Usage:**
				After adding me to your server, join a voice channel and type \`~~join\` to bind me to that voice channel.
				Keep in mind that you need to have the \`Manage Server\` permission to use this command.
				**Commands:**
				**\\~~join**: Type this while in a voice channel to have the bot join that channel and start playing there. Limited to users with the "manage server" permission.
				**\\~~leave**: Makes the bot leave the voice channel it's currently in.
				**\\~~np**: Gets the currently playing song and artist. If the song was requested by someone, also gives their name.
				**\\~~ignore**: Ignores commands in the current channel. Admin commands are exempt from the ignore.
				**\\~~unignore**: Unignores commands in the current channel.
				**\\~~ignore all**: Ignores commands in all channels on the guild.
				**\\~~unignore all**: Unignores all channels on the guild.
				**\\~~prefix !** Changes the bot's prefix for this server. Prefixes cannot contain whitespace, letters, or numbers - anything else is fair game. It's recommended that you stick with the default prefix of ~~, but this command is provided in case you find conflicts with other bots.
				For additional commands and help, please visit [Github](https://github.com/WeebDev/listen.moe-discord)`,
				color: 15473237
			}
		})
		/* eslint-enable max-len */
	)
	.on('guildDelete', guild => client.provider.clear(guild.id))
	.on('commandRun', (cmd, promise, msg, args) =>
		winston.info(oneLine`[DISCORD][SHARD: ${client.shard.id}]: ${msg.author.tag} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args).length ? `>>> ${Object.values(args)}` : ''}
		`)
	)
	.on('commandError', (cmd, err) => {
		if (err instanceof FriendlyError) return;
		winston.error(`[DISCORD][SHARD: ${client.shard.id}]: Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		/* eslint-disable max-len */
		winston.info(oneLine`
			[DISCORD][SHARD: ${client.shard.id}]: Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; User ${msg.author.tag} (${msg.author.id}): ${reason}
		`);
		/* eslint-disable max-len */
	})
	.on('commandPrefixChange', (guild, prefix) =>
		winston.info(oneLine`
			[DISCORD][SHARD: ${client.shard.id}]: Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`)
	)
	.on('commandStatusChange', (guild, command, enabled) =>
		winston.info(oneLine`
			[DISCORD][SHARD: ${client.shard.id}]: Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`)
	)
	.on('groupStatusChange', (guild, group, enabled) =>
		winston.info(oneLine`
			[DISCORD][SHARD: ${client.shard.id}]: Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`)
	);

client.registry
	.registerGroups([
		['listen', 'Listen.moe'],
		['music', 'Music'],
		['economy', 'Economy'],
		['games', 'Games'],
		['item', 'Items'],
		['social', 'Social'],
		['backgrounds', 'Backgrounds'],
		['util', 'Utility']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login();

process.on('unhandledRejection', err => winston.error(`Uncaught Promise Error: \n${err.stack}`));
