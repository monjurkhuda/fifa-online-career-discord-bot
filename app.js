const config = require('./config');
const Discord = require('discord.js');

const client = new Discord.Client();
const { Managers, TransferMarket, Results, TeamPlayers, YouthFacilities, Clubs } = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();
const PREFIX = '!';

let daily = require('./Daily.js');
const sleep = (milliseconds) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

Reflect.defineProperty(currency, 'add', {
	value: async function add(id, amount) {
		const manager = currency.get(id);
		if (manager) {
			manager.balance += Number(amount);
			return manager.save();
		}
		const newManager = await Managers.create({ manager_id: id, balance: amount });
		currency.set(id, newManager);
		return newManager;
	},
});

Reflect.defineProperty(currency, 'getBalance', {
	value: function getBalance(id) {
		const manager = currency.get(id);
		return manager ? manager.balance : 0;
	},
});

client.once('ready', async () => {
	const storedBalances = await Managers.findAll();
	storedBalances.forEach(b => currency.set(b.manager_id, b));
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
	if (message.author.bot) return;
	currency.add(message.author.id, 1000);

	if (!message.content.startsWith(PREFIX)) return;
	const input = message.content.slice(PREFIX.length).trim();
	if (!input.length) return;
	const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);

	if (command === 'balance') {
		const target = message.mentions.users.first() || message.author;
		return message.channel.send(`${target || target.tag} has ${currency.getBalance(target.id)}€`);

	} else if (command === 'assignclub') {
		const target = message.mentions.users.first() || message.author;
		const splitArgs = commandArgs.split(' ');

		console.log(splitArgs[1].toString());

		const club = await Clubs.findOne({ where: { name: { [Op.like]: splitArgs[1] } } });
		if (!club) return message.channel.send('Please check the proper spelling of the club. We use non-spaced & short names, like ManUtd, ManCity...');

		await Clubs.update({ manager_id: target.id }, { where: { name: { [Op.like]: splitArgs[1] } } });

		message.channel.send(`${target || target.tag} has been assigned as the manager of ${club.name}`);
					   		 	  	  	   
	} else if (command === 'teaminfo') {
		const target = message.mentions.users.first() || message.author;
		const manager = await Managers.findOne({ where: { manager_id: target.id } });
		const items = await manager.getItems();

		if (!items.length) return message.channel.send(`${target || target.tag} has no players!`);
		return message.channel.send(`${target || target.tag} currently has ${items.map(t => `${t.player.name}`).join(', ')}.`);

	} else if (command === 'transferbalance') {
		const currentAmount = currency.getBalance(message.author.id);
		const transferAmount = commandArgs.split(/ +/).find(arg => !/<@!?\d+>/.test(arg));
		const transferTarget = message.mentions.users.first();

		if (!transferAmount || isNaN(transferAmount)) return message.channel.send(`Sorry ${message.author}, that's an invalid amount`);
		if (transferAmount > currentAmount) return message.channel.send(`Sorry ${message.author} you don't have that much.`);
		if (transferAmount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author}`);

		currency.add(message.author.id, -transferAmount);
		currency.add(transferTarget.id, transferAmount);
		return message.channel.send(`Successfully transferred ${transferAmount}€ to ${transferTarget.tag}. Your current balance is ${currency.getBalance(message.author.id)}€`);

	} else if (command === 'findplayer') {
		const player = await TransferMarket.findAll({ where: { name: { [Op.like]: commandArgs } } });
		if (!player) return message.channel.send('That player doesn\'t exist.');
		if (player) {
			player.forEach(function (obj) {
				message.channel.send(`Name: ${obj.name}   Age: ${obj.age}
									\nClub: ${obj.club}
									\nPosition: ${obj.position}   Rating: ${obj.current_rating}
									\nValue: ${obj.value}
									\nWage: ${obj.wage}
									\nID: ${obj.id}
									\n--^--^--^--^--^--^--^--`);
			});
		}

	} else if (command === 'bidplayer') {
		const player = await TransferMarket.findOne({ where: { id: { [Op.like]: commandArgs } } });
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		let clubBalance = managerClub.balance;
		console.log(player.manager_id);
		console.log(message.author.id);
		if (!player) { return message.channel.send('That player ID doesn\'t exist.'); }
		else if (player.value > managerClub.balance) {
			return message.channel.send(`You don't have enough Euros, ${message.author}!`);
		} else if (player.manager_id) {
			return message.channel.send(`Please make a formal enquiry to ${player.club}.`);
		} else {
			await Clubs.update({ balance: clubBalance - player.value }, { where: { manager_id: message.author.id } });
			await TransferMarket.update({ manager_id: message.author.id, club: managerClub.name }, { where: { id: commandArgs } });
			message.channel.send(`${player.name} signs for ${managerClub.name}!`);
		}

	} else if (command === 'playerinfo') {
		const player = await TransferMarket.findOne({ where: { name: { [Op.like]: commandArgs } } });
		if (!player) return message.channel.send('That player doesn\'t exist.');
		if (player) {
			message.channel.send(`${player.name} costs ${player.value} Euros.`);
		}

	} else if (command === 'timetest') {
		message.channel.send('Hmm. I like the amount you are offering. Let me think about it for 5 seconds.');

		setTimeout(function () {
			// use the message's channel (TextChannel) to send a new message
			message.channel.send("Ok sounds good. Let's make a deal.")
				.catch(console.error); // add error handling here
		}, 5 * 1000);

	} else if (command === 'result') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		console.log(args);
		if (args[1] === 'league') {
			message.channel.send(`Sure the score was ${args[2]} ${args[3]} : ${args[6]} ${args[5]}? \nReply Y to confirm.`);

			client.on('message', async resultResponse => {
				if (resultResponse.content === 'Y') {
					if (args[3] > args[5]) { message.channel.send(`5 million awarded to ${args[2]} for the league match win. 2 million awarded to ${args[6]} for the loss.`); }
					else { message.channel.send(`5 million awarded to ${args[6]} for the league match win. 2 million awarded to ${args[2]} for the loss.`); }
				} else { return; }
			});
		};
	} else if (command === 'createfixtures') {

		let fixtureDate = function (increment) {
			var date = new Date();
			date.setDate(date.getDate() + increment);
			var dd = String(date.getDate()).padStart(2, '0');
			var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
			var yyyy = date.getFullYear();
			date = mm + '/' + dd + '/' + yyyy;
			return date;
		}

		wsone = fixtureDate(0);
		weone = fixtureDate(7);
		wstwo = fixtureDate(8);
		wetwo = fixtureDate(14);
		wsthree = fixtureDate(15);
		wethree = fixtureDate(21);
		wsfour = fixtureDate(22);
		wefour = fixtureDate(28);

		function shuffle(array) {
			var currentIndex = array.length, temporaryValue, randomIndex;

			// While there remain elements to shuffle...
			while (0 !== currentIndex) {

				// Pick a remaining element...
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				// And swap it with the current element.
				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			}

			return array;
		}

		let teamlist = ['Man City', 'Barcelona', 'Real Madrid', 'Liverpool'];
		shuffle(teamlist);

		message.channel.send(`<-- ROUND 1: ${wsone} to ${weone} -->\n${teamlist[0]} vs ${teamlist[3]}\n${teamlist[1]} vs ${teamlist[2]}\n${teamlist[3]} vs ${teamlist[2]}\n\n<-- ROUND 2: ${wstwo} to ${wetwo} -->\n${teamlist[0]} vs ${teamlist[1]}\n${teamlist[1]} vs ${teamlist[3]}\n${teamlist[2]} vs ${teamlist[0]}`);

	} else if (command === 'dailytasks') {

				
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// NEWS
		let eventsProbabInterval = [];
		let i = 0;
		let maxnum = 0;
		let teams = ['ManUtd', 'ManCity', 'Tottenham', 'Chelsea', 'Arsenal', 'Liverpool', 'Barcelona', 'Madrid', 'Atletico', 'Dortmund', 'Bayern', 'PSG'];

		//miracle = 1%, rare = 5%, frequent = 15%, everyday = 30%
		let events = [
			{ event: "player_leave", probability: 15, func: player_leave },
			{ event: "sheikh_takeover", probability: 1, func: sheikh_takeover },
			{ event: "injury", probability: 30, func: injury }
		];

		for (let i = 0; i < events.length; i++) {
			maxnum = maxnum + events[i].probability;
			eventsProbabInterval[i] = maxnum;
		}

		for (let i = 0; i < teams.length; i++) {
			newsNumber = randomInt(maxnum);
			console.log("newsNumber: " + newsNumber);

			if (newsNumber <= events[0].probability) {
				console.log(teams[i] + ": ");
				message.channel.send(`${teams[i]}:`);
				events[0].func();				
			}

			for (let j = 1; j < events.length; j++) {
				if (newsNumber > eventsProbabInterval[j - 1] && newsNumber <= eventsProbabInterval[j]) {
					console.log(teams[i] + ": ");
					message.channel.send(`${teams[i]}:`);
					events[j].func();					
				}
			}
		};

		function sheikh_takeover() {
			message.channel.send('Sheikh took over your club.');
		};

		function injury() {
			message.channel.send('Your star player is injured.');
		};

		function player_leave() {
			message.channel.send('Player wants to leave club.');
		};

		function randomInt(max) {
			randomInteger = Math.floor(Math.random() * max) + 1;
			return randomInteger;
		};

		
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	}

});

client.login(config.token);