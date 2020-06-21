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
		const target = message.author;
		const club = await Clubs.findOne({ where: { manager_id: target.id } });
		return message.channel.send(`${club.name} currently has a balance of ${club.balance}€`);
		
	} else if (command === 'assignclub') {
		const target = message.mentions.users.first() || message.author;
		const splitArgs = commandArgs.split(' ');

		console.log(splitArgs[1].toString());

		const club = await Clubs.findOne({ where: { name: { [Op.like]: splitArgs[1] } } });
		if (!club) return message.channel.send('Please check the spelling of the club name. We use specific, non-spaced, short nicknames.');

		await Clubs.update({ manager_id: target.id }, { where: { name: { [Op.like]: splitArgs[1] } } });
		await Managers.update({ club: club.name }, { where: { manager_id: { [Op.like]: target.id } } });

		message.channel.send(`${target || target.tag} has been assigned as the manager of ${club.name}`);
		
	} else if (command === 'teaminfo') {
		const target = message.mentions.users.first() || message.author;
		const players = await TransferMarket.findAll({ where: { manager_id: target.id } });
		
		if (players) {
			players.forEach(function (obj) {
				message.channel.send(`${obj.position} > ${obj.name} / ${obj.current_rating}\n`);
				return;
			});
		}

		if (!players.length) {
			message.channel.send(`${target || target.tag} currently manages no players.`);
		}

		console.log(`Manager ID: ${players}`);
		console.log(`Messenger ID: ${target.id}`);

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
		if (!player.length) return message.channel.send('That player doesn\'t exist.');
		if (player) {			

		player.forEach(function (obj) {
			console.log(obj.loan_club);

			if (obj.loan_club) {
				player.forEach(function (obj) {
					message.channel.send(`Name: ${obj.name}   Age: ${obj.age}
						\nClub: ${obj.loan_club} (On Loan Until: ${obj.loan_end})
						\nLoaned From: ${obj.club}
						\nPosition: ${obj.position}   Rating: ${obj.current_rating}
						\nValue: ${obj.value}
						\nWage: ${obj.wage}
						\nID: ${obj.id}
						\n--^--^--^--^--^--^--^--`);
				})
			} else message.channel.send(`Name: ${obj.name}   Age: ${obj.age}
					\nClub: ${obj.club}
					\nPosition: ${obj.position}   Rating: ${obj.current_rating}
					\nValue: ${obj.value}
					\nWage: ${obj.wage}
					\nID: ${obj.id}
					\n--^--^--^--^--^--^--^--`)
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
			return message.channel.send(`You don't have enough €s, ${message.author}!`);
		} else if (player.manager_id) {
			return message.channel.send(`Please make a formal enquiry to ${player.club} Manager.`);
		} else {
			await TransferMarket.update({ manager_id: message.author.id, club: managerClub.name }, { where: { id: commandArgs } });
			await Clubs.update({ balance: clubBalance - player.value }, { where: { manager_id: message.author.id } });
			message.channel.send(`${player.name} signs for ${managerClub.name} for ${player.value} €s!`);
		}

	} else if (command === 'loanplayer') {
		var oneWeek = new Date();
		oneWeek.setDate(oneWeek.getDate() + 7);
		var dd = String(oneWeek.getDate()).padStart(2, '0');
		var mm = String(oneWeek.getMonth() + 1).padStart(2, '0');
		var yyyy = oneWeek.getFullYear();
		oneWeek = mm + '/' + dd + '/' + yyyy;

		const player = await TransferMarket.findOne({ where: { id: { [Op.like]: commandArgs } } });
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		let clubBalance = managerClub.balance;
		let loanFee = player.value * 0.1;
		console.log(player.manager_id);
		console.log(message.author.id);
		if (player.manager_id) {
			message.channel.send(`Please make a formal enquiry to ${player.club} Manager.`);
		} else if (player.loan_club) {
			message.channel.send(`${player.name} is currently on loan in ${player.loan_club} until ${player.loan_end}.`);
		} else if (!player.manager_id) {
			if (player.current_rating > 84 || player.age > 23) {
				message.channel.send(`This player is not available for loan. Non-Human-Managed players must be 23 or younger and rated under 85.`);
			}
		} else if (loanFee > managerClub.balance) {
			message.channel.send(`The loan fee for ${player.name} is ${loanFee}/week. Currently, your club cannot afford this loan.`);
		} else {
			await TransferMarket.update({ loan_club: managerClub.name, loan_end: oneWeek }, { where: { id: commandArgs } });
			await Clubs.update({ balance: clubBalance - loanFee }, { where: { manager_id: message.author.id } });
			message.channel.send(`${player.name} is loaned to ${managerClub.name} until ${oneWeek} for a fee of ${loanFee} €.`);
		}

	} else if (command === 'swapplayer') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		const inPlayer = await TransferMarket.findOne({ where: { id: { [Op.like]: args[1] } } });
		const outPlayer = await TransferMarket.findOne({ where: { id: { [Op.like]: args[2] } } });
		let clubBalance = managerClub.balance;
		let loanFee = player.value * 0.1;
		if (inPlayer.manager_id) {
			message.channel.send(`Please make a formal enquiry to ${player.club} Manager.`);
		} else if (player.loan_club) {
			message.channel.send(`${player.name} is currently on loan in ${player.loan_club} until ${player.loan_end}.`);
		} else if (!player.manager_id) {
			if (player.current_rating > 84 || player.age > 23) {
				message.channel.send(`This player is not available for loan. Non-Human-Managed players must be 23 or younger and rated under 85.`);
			}
		} else if (loanFee > managerClub.balance) {
			message.channel.send(`The loan fee for ${player.name} is ${loanFee}/week. Currently, your club cannot afford this loan.`);
		} else {
			await TransferMarket.update({ loan_club: managerClub.name, loan_end: oneWeek }, { where: { id: commandArgs } });
			await Clubs.update({ balance: clubBalance - loanFee }, { where: { manager_id: message.author.id } });
			message.channel.send(`${player.name} is loaned to ${managerClub.name} until ${oneWeek} for a fee of ${loanFee} €.`);
		}

	} else if (command === 'playerinfo') {
		const player = await TransferMarket.findOne({ where: { name: { [Op.like]: commandArgs } } });
		if (!player) return message.channel.send('That player doesn\'t exist.');
		if (player) {
			message.channel.send(`${player.name} has a transfer fee of ${player.value} €`);
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
		//NEWS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
		
		//LoanEnds////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0');
		var yyyy = today.getFullYear();
		today = mm + '/' + dd + '/' + yyyy;

		const loanEndedPlayer = await TransferMarket.findAll({ where: { loan_end: { [Op.like]: today } } });
		loanEndedPlayer.forEach(async function (obj) {
			console.log(`Today: ${today}`);
			console.log(`Player: ${obj.name}`);
			console.log(`Today: ${obj.loan_end}`);
			message.channel.send(`${obj.name} ends his loan with ${obj.loan_club} and returns to ${obj.club}`);
			await TransferMarket.update({ loan_club: null, loan_end: null }, { where: { id: obj.id } });
		});
	}

});

client.login(config.token);