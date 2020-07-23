const config = require('./config');
const Discord = require('discord.js');

const client = new Discord.Client();
const { Managers, TransferMarket, Results, YouthFacilities, YouthCoaches, Clubs } = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();
const PREFIX = '!';

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

	} else if (command === 'myteam') {
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

	} /*else if (command === 'transferbalance') {
		const currentAmount = currency.getBalance(message.author.id);
		const transferAmount = commandArgs.split(/ +/).find(arg => !/<@!?\d+>/.test(arg));
		const transferTarget = message.mentions.users.first();

		if (!transferAmount || isNaN(transferAmount)) return message.channel.send(`Sorry ${message.author}, that's an invalid amount`);
		if (transferAmount > currentAmount) return message.channel.send(`Sorry ${message.author} you don't have that much.`);
		if (transferAmount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author}`);

		currency.add(message.author.id, -transferAmount);
		currency.add(transferTarget.id, transferAmount);
		return message.channel.send(`Successfully transferred ${transferAmount}€ to ${transferTarget.tag}. Your current balance is ${currency.getBalance(message.author.id)}€`);

	}*/ else if (command === 'findplayer') {
		const player = await TransferMarket.findAll({ where: { name: { [Op.like]: commandArgs } } });
		if (!player.length) return message.channel.send('That player doesn\'t exist.');
		if (player) {
			player.forEach(function (obj) {
				if (obj.loan_club) {
					message.channel.send(`Name: ${obj.name}   Age: ${obj.age}
Loaned to: ${obj.loan_club} Loan Until: ${obj.loan_end}
Owner Club: ${obj.club}
Position: ${obj.position}   Rating: ${obj.current_rating}
Value: ${obj.value}€
Wage: ${obj.wage}€
ID: ${obj.id}
--^--^--^--^--^--^--^--`)
				} else {
					message.channel.send(`Name: ${obj.name}   Age: ${obj.age}
Club: ${obj.club}
Position: ${obj.position}   Rating: ${obj.current_rating}
Value: ${obj.value}€
Wage: ${obj.wage}€
ID: ${obj.id}
--^--^--^--^--^--^--^--`)
				}
			});
		}

	} else if (command === 'playerreport') {
		const player = await TransferMarket.findOne({ where: { id: { [Op.like]: commandArgs } } });
		if (!player) {
			message.channel.send('That player doesn\'t exist.');
		} else if (player.manager_id != message.author.id) {
			return message.channel.send(`You can only get reports on players contracted to your team. ${player.name} plays for ${player.club}.`);
		} else {
			if (player.loan_club) {
				message.channel.send(`Name: ${player.name}   Age: ${player.age}
Loaned to: ${player.loan_club} Loan Until: ${player.loan_end}
Position: ${player.position}
Rating: ${player.current_rating}   Potential: ${player.potential_rating}
Happiness: ${player.happiness}
Injured Until (if any): ${player.injured_until}
Value: ${player.value}€
Wage: ${player.wage}€
ID: ${player.id}`)
			} else {
				message.channel.send(`Name: ${player.name}   Age: ${player.age}
Club: ${player.club}
Position: ${player.position}
Rating: ${player.current_rating}   Potential: ${player.potential_rating}
Happiness: ${player.happiness}
Injured Until (if any): ${player.injured_until}
Value: ${player.value}€
Wage: ${player.wage}€
ID: ${player.id}`)
			}
		}

	} else if (command === 'buyplayer') {
		const player = await TransferMarket.findOne({ where: { id: { [Op.like]: commandArgs } } });
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		let clubBalance = managerClub.balance;		
		if (!player) { return message.channel.send('That player ID doesn\'t exist.'); }
		else if (player.value > managerClub.balance) {
			return message.channel.send(`${player.name} costs ${player.value}€. Unfortunately, you don't have enough funds.`);
		} else if (player.manager_id) {
			return message.channel.send(`Please make a formal enquiry to ${player.club} Manager.`);
		} else if (player.loan_club) {
			return message.channel.send(`${player.name} is currently on loan in ${player.loan_club} until ${player.loan_end}.`);
		} else {
			message.channel.send(`${player.name} signs for ${managerClub.name} for ${player.value}€!`);
			client.channels.cache.get('724832698161561642').send(`${player.name} to ${managerClub.name} from ${player.club} for ${player.value}€`);
			await TransferMarket.update({ manager_id: message.author.id, club: managerClub.name }, { where: { id: commandArgs } });
			await Clubs.update({ balance: clubBalance - player.value }, { where: { manager_id: message.author.id } });
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

		if (player.manager_id) {
			message.channel.send(`Please make a formal enquiry to ${player.club} Manager.`);
		} else if (player.loan_club) {
			message.channel.send(`${player.name} is currently on loan in ${player.loan_club} until ${player.loan_end}.`);
		} else if (!player.manager_id && (player.current_rating > 84 || player.age > 23)) {
			message.channel.send(`This player is not available for loan. Non-Human-Managed players must be 23 or younger and rated under 85.`);
		} else if (clubBalance < loanFee) {
			message.channel.send(`The loan fee for ${player.name} is ${loanFee}. Currently, your club cannot afford this loan.`);
		} else {
			message.channel.send(`${player.name} is loaned to ${managerClub.name} until ${oneWeek} for a fee of ${loanFee}€`);
			client.channels.cache.get('724832698161561642').send(`LOAN: ${player.name} to ${managerClub.name} from ${player.club} for ${loanFee}€ until ${oneWeek}`);
			await TransferMarket.update({ loan_club: managerClub.name, loan_end: oneWeek }, { where: { id: commandArgs } });
			await Clubs.update({ balance: clubBalance - loanFee }, { where: { manager_id: message.author.id } });
		}

	} else if (command === 'swapplayer') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		const inPlayer = await TransferMarket.findOne({ where: { id: { [Op.like]: args[1] } } });
		const outPlayer = await TransferMarket.findOne({ where: { id: { [Op.like]: args[2] } } });
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		let clubBalance = managerClub.balance;
		let outPlayerValue = outPlayer.value * 0.95;
		if (outPlayer.manager_id != message.author.id) {
			return message.channel.send(`Cheeky! ${outPlayer.name} does not belong to your team ^_^`);
		} else if (inPlayer.club === 'Free Agent') {
			return message.channel.send(`${inPlayer.name} is a Free Agent!`);
		} else if (inPlayer.manager_id) {
			return message.channel.send(`Please make a formal enquiry to ${inPlayer.club} Manager.`);
		} else if (inPlayer.loan_club) {
			return message.channel.send(`${inPlayer.name} is currently on loan in ${inPlayer.loan_club} until ${inPlayer.loan_end}.`);
		} else if ((outPlayerValue + managerClub.balance) < inPlayer.value) {
			message.channel.send(`${inPlayer.name} is valued at ${inPlayer.value}. Unfortunately, your balance is currently too low to make up the difference in the player swap.`);
		} else if (inPlayer.value > outPlayerValue) {
			message.channel.send(`${inPlayer.name} joins ${managerClub.name} in a swap deal with ${inPlayer.club} for ${outPlayer.name}. ${managerClub.name} pays ${inPlayer.value - outPlayerValue}€ to ${inPlayer.club} as part of the deal.`);
			client.channels.cache.get('724832698161561642').send(`SWAP: ${inPlayer.name} to ${managerClub.name} from ${inPlayer.club} for ${inPlayer.value - outPlayerValue}€ plus ${outPlayer.name}`);
			await TransferMarket.update({ manager_id: null, club: inPlayer.club }, { where: { id: args[2] } });
			await TransferMarket.update({ manager_id: message.author.id, club: managerClub.name }, { where: { id: args[1] } });
			await Clubs.update({ balance: clubBalance - (inPlayer.value - outPlayerValue) }, { where: { manager_id: message.author.id } });
		} else if (outPlayerValue > inPlayer.value) {
			message.channel.send(`${inPlayer.name} joins ${managerClub.name} in a swap deal with ${inPlayer.club} for ${outPlayer.name}. ${managerClub.name} receives ${outPlayerValue - inPlayer.value}€ from ${inPlayer.club} as part of the deal.`);
			client.channels.cache.get('724832698161561642').send(`SWAP: ${inPlayer.name} plus ${outPlayerValue - inPlayer.value}€ to ${managerClub.name} from ${inPlayer.club} for ${outPlayer.name}`);
			await TransferMarket.update({ manager_id: null, club: inPlayer.club }, { where: { id: args[2] } });
			await TransferMarket.update({ manager_id: message.author.id, club: managerClub.name }, { where: { id: args[1] } });
			await Clubs.update({ balance: clubBalance + (outPlayerValue - inPlayer.value) }, { where: { manager_id: message.author.id } });
		} else if (outPlayerValue === inPlayer.value) {
			message.channel.send(`${inPlayer.name} joins ${managerClub.name} in a straight swap deal with ${inPlayer.club} for ${outPlayer.name}.`);
			client.channels.cache.get('724832698161561642').send(`SWAP: ${inPlayer.name} to ${managerClub.name} from ${inPlayer.club} for ${outPlayer.name}`);
			await TransferMarket.update({ manager_id: null, club: inPlayer.club }, { where: { id: args[2] } });
			await TransferMarket.update({ manager_id: message.author.id, club: managerClub.name }, { where: { id: args[1] } });
		}

	} else if (command === 'releaseplayer') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		const player = await TransferMarket.findOne({ where: { id: { [Op.like]: args[1] } } });
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		let clubBalance = managerClub.balance;
		let releasedPlayerValue = player.value * 0.95;
		console.log(`${managerClub.manager_id}       ${message.author.id}`);
		if (player.club === managerClub.name) {
			message.channel.send(`${player.name} was released by ${managerClub.name} to be a Free Agent. The club was compensated with ${releasedPlayerValue}€`);
			client.channels.cache.get('724832698161561642').send(`RELEASED: ${player.name} released by ${managerClub.name}. ${managerClub.name} compensated with ${releasedPlayerValue}€`);
			await Clubs.update({ balance: clubBalance + releasedPlayerValue }, { where: { manager_id: message.author.id } });
			await TransferMarket.update({ manager_id: null, club: 'Free Agent' }, { where: { id: args[1] } });
		} else {
			return message.channel.send(`${player.name} is not a ${managerClub.name} player.`);
		}

	} else if (command === 'sellplayer') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		const sellerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		const player = await TransferMarket.findOne({ where: { id: { [Op.like]: args[1] } } });
		let buyer = message.mentions.users.first();
		const buyerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: buyer.id } } });
		let sellerClubBalance = sellerClub.balance;
		let buyerClubBalance = buyerClub.balance;
		let sellingPrice = Number(args[2]);

		if (sellingPrice <= buyerClubBalance) {
			if (player.club === sellerClub.name) {
				message.channel.send(`${sellerClub.name} is offering ${player.name} to ${buyerClub.name} for a fee of ${sellingPrice}€. Please react with 👍 emoji to the offer within 5 minutes to confirm the deal.\n`);

				const filter = (reaction, user) => {
					return reaction.emoji.name === '👍' && user.id === buyer.id;
				};
				const collector = message.createReactionCollector(filter, { time: 1000 * 60 * 5 });
				collector.on('collect', (reaction, user) => {
					message.channel.send(`${player.name} moves from ${sellerClub.name} to ${buyerClub.name} for a fee of ${sellingPrice}€`);
					client.channels.cache.get('724832698161561642').send(`${player.name} to ${buyerClub.name} from ${player.club} for ${sellingPrice}€`);
					sellUpdate();
					collector.stop();
				});
				async function sellUpdate() {
					await Clubs.update({ balance: sellerClubBalance + sellingPrice }, { where: { manager_id: sellerClub.manager_id } });
					await Clubs.update({ balance: buyerClubBalance - sellingPrice }, { where: { manager_id: buyerClub.manager_id } });
					await TransferMarket.update({ manager_id: buyerClub.manager_id, club: buyerClub.name }, { where: { id: args[1] } });
				}
			} else {
				return message.channel.send(`${player.name} is not a ${sellerClub.name} player.`);
			}

		} else {
			return message.channel.send(`Unfortunately, ${buyerClub.name} currently cannot afford the fee asked for ${player.name}.`);
		}

	} else if (command === 'findyouthcoach') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		const youthCoaches = await YouthCoaches.findAll({ where: { level: args[1] } });

		if (!youthCoaches.length) {
			message.channel.send('Use command: !findyouthcoach #. Replace # with with the level of youth coach you want to search for (1 to 5).');
		} else if (youthCoaches) {
			youthCoaches.forEach(function (obj) {
				message.channel.send(`Name: ${obj.name}\nClub: ${obj.club}\nLevel: ${obj.level}\nWage: ${obj.wage}€\nID: ${obj.id}\n--^--^--^--^--^--^--^--`);
			});
		}

	} else if (command === 'hireyouthcoach') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		const youthCoaches = await YouthCoaches.findOne({ where: { id: args[1] } });
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		const currentYouthFacilitiesRating = managerClub.youth_facilities_rating;
		const youthCoachLevel = youthCoaches.level;
		const numberOfYouthCoaches = managerClub.youth_coaches;

		if (youthCoaches.club != 'Unemployed') {
			return message.channel.send(`${youthCoaches.name} is currently under contract with ${youthCoaches.club}.`);
		} else if (youthCoaches.wage > managerClub.balance) {
			return message.channel.send(`${youthCoaches.name} refuses to join ${managerClub.name} as they are currently unable to cover his weekly wage of ${youthCoaches.wage}€!`);
		} else if (numberOfYouthCoaches >= 4) {
			return message.channel.send(`${youthCoaches.name} cannot join ${managerClub.name} as they already have 4 youth coaches!`);
		} else {
			await managerClub.update({ youth_facilities_rating: currentYouthFacilitiesRating + youthCoachLevel, youth_coaches: numberOfYouthCoaches + 1 }, { where: { id: args[1] } });
			await youthCoaches.update({ club: managerClub.name }, { where: { id: args[1] } });
			message.channel.send(`${youthCoaches.name} signs a youth coaching contract with ${managerClub.name} which will see him net a weekly wage of ${youthCoaches.wage}€!`);
		}

	} else if (command === 'upgradeyouthfacility') {
		const managerClub = await Clubs.findOne({ where: { manager_id: { [Op.like]: message.author.id } } });
		const youthFacilityRating = Number(managerClub.youth_facility_level);
		const currentYouthFacilitiesRating = Number(managerClub.youth_facilities_rating);
		let reactor = message.author.id;
		var youthFacilityReputation = ['neighborhood', 'borough', 'city', 'country', 'continent', 'world'];
		var upgradeCost = [0, 1000000, 5000000, 10000000, 17000000, 25000000];
		var clubBalance = managerClub.balance;
		var upgradeExpense = Number(upgradeCost[youthFacilityRating + 1]);		

		if (youthFacilityRating > 4) {
			return message.channel.send(`Your youth facility is already a ${youthFacilityReputation[youthFacilityRating]}-renowned institution.`);
		} else if (clubBalance < upgradeCost[youthFacilityRating + 1]) {
			message.channel.send(`${managerClub.name} cannot afford an upgrade to a ${youthFacilityReputation[youthFacilityRating + 1]} class facility as they are short of ${upgradeCost[youthFacilityRating + 1]}€`);
		} else {
			message.channel.send(`${managerClub.name} has a ${youthFacilityReputation[youthFacilityRating]}-wide youth facility.\nTo confirm the upgrade to a ${youthFacilityReputation[youthFacilityRating + 1]} class facility for ${upgradeCost[youthFacilityRating + 1]}€, please react with 👍 emoji to '!upgradeyouthfacility' command above within 5 minutes.\nTip: Hiring youth coaches is a cheaper and usually faster way of developing your youth players.`);
			const filter = (reaction, user) => {
				return reaction.emoji.name === '👍' && user.id === reactor;
				console.log(user.id, reactor);
			};
			const collector = message.createReactionCollector(filter, { time: 1000 * 60 * 5 });
			collector.on('collect', (reaction, user) => {
				message.channel.send(`${managerClub.name} have upgraded to a ${youthFacilityReputation[youthFacilityRating + 1]} class youth facility for a whopping ${upgradeCost[youthFacilityRating + 1]}€!`);
				youthFacilityUpgrade();
				collector.stop();
			});
			async function youthFacilityUpgrade() {
				await managerClub.update({ youth_facilities_rating: currentYouthFacilitiesRating + 1, youth_facility_level: youthFacilityRating + 1, balance: clubBalance - upgradeExpense }, { manager_id: { [Op.like]: message.author.id } });
			}
		}

	} else if (command === 'timetest') {
		message.channel.send('Hmm. I like the amount you are offering. Let me think about it for 5 seconds.');
		setTimeout(function () {
			message.channel.send("Ok sounds good. Let's make a deal.")
				.catch(console.error);
		}, 5 * 1000);

	} else if (command === 'result') {
		const args = message.content.slice(PREFIX.length).split(/ +/);
		console.log(args);
		if (args[1] === 'league') {
			message.channel.send(
				`Sure the score was ${args[2]} ${args[3]} : ${args[6]} ${args[5]}?\nReply Y to confirm.`);

			client.on('message', async resultResponse => {
				if (resultResponse.content === 'Y') {
					if (args[3] > args[5]) { message.channel.send(`5 million to ${args[2]} for win & 2 million to ${args[6]} for the loss.`); }
					else { message.channel.send(`5 million to ${args[6]} for win & 2 million to ${args[2]} for the loss.`); }
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

		message.channel.send(
			`<-- ROUND 1: ${wsone} to ${weone} -->\n
			${teamlist[0]} vs ${teamlist[3]}\n
			${teamlist[1]} vs ${teamlist[2]}\n
			${teamlist[3]} vs ${teamlist[2]}\n\n
			<-- ROUND 2: ${wstwo} to ${wetwo} -->\n
			${teamlist[0]} vs ${teamlist[1]}\n
			${teamlist[1]} vs ${teamlist[3]}\n
			${teamlist[2]} vs ${teamlist[0]}`);

	} else if (command === 'dailytasks') {
		//NEWS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/*let eventsProbabInterval = [];
		let i = 0;
		let maxnum = 0;
		let teams = ['ManUtd', 'ManCity', 'Tottenham', 'Chelsea', 'Arsenal', 'Liverpool', 'Barcelona', 'Madrid', 'Atletico', 'Dortmund', 'Bayern', 'PSG', 'Juventus', 'Milan', 'Inter'];

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

			if (newsNumber <= events[0].probability) {
				message.channel.send(`${teams[i]}:`);
				events[0].func();				
			}

			for (let j = 1; j < events.length; j++) {
				if (newsNumber > eventsProbabInterval[j - 1] && newsNumber <= eventsProbabInterval[j]) {
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
		};*/

		//LoanEnds////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0');
		var yyyy = today.getFullYear();
		today = mm + '/' + dd + '/' + yyyy;

		const loanEndedPlayer = await TransferMarket.findAll({ where: { loan_end: { [Op.like]: today } } });
		loanEndedPlayer.forEach(async function (obj) {
			client.channels.cache.get('724832698161561642').send(`END OF LOAN: ${obj.name} ends his loan with ${obj.loan_club} and returns to ${obj.club}`);
			await TransferMarket.update({ loan_club: null, loan_end: null }, { where: { id: obj.id } });
		});

		//YouthTasks//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		const youthClub = await Clubs.findAll({ where: { manager_id: { [Op.ne]: null } } });
		const youthPlayer = await TransferMarket.findAll({ where: { age: { [Op.lte]: 23 } } });
		
		youthClub.forEach(async function (obj) {
			var nameDisplay = obj.name;
			console.log(nameDisplay);
			var currentYouthFacilitiesRating = obj.youth_facilities_rating;
			console.log(currentYouthFacilitiesRating);

			youthPlayer.forEach(async function (plobj) {				
				if (plobj.current_rating >= plobj.potential_rating) {
					await TransferMarket.update({ current_rating: plobj.potential_rating }, { where: { id: plobj.id } });
					return console.log(`${plobj.name} reached his full potential of ${plobj.potential_rating}`);					
				} else if (obj.name === plobj.club) {
					if (plobj.current_rating >= plobj.potential_rating) { await TransferMarket.update({ current_rating: plobj.potential_rating }, { where: { id: plobj.id } }); }
					var nameDisplay = plobj.name;
					console.log(nameDisplay);
					var currentPlayerRating = plobj.current_rating;					
					var newPlayerRating = currentPlayerRating + (currentYouthFacilitiesRating * 0.016);
					var newPlayerWage = 12 * Math.pow(Math.E, 0.10819778284 * newPlayerRating);
					var newPlayerWageRounded = Math.floor(newPlayerWage / 500) * 500;
					var newPlayerValue = (7 / 7300000000000) * Math.pow(newPlayerRating, 10.245);
					var newPlayerValueRounded = Math.floor(newPlayerValue / 100000) * 100000;
					await TransferMarket.update({ current_rating: newPlayerRating, wage: newPlayerWageRounded, value: newPlayerValueRounded }, { where: { id: plobj.id } });
					console.log(`plobj.current_rating: ${plobj.current_rating}     obj.level: ${obj.level}`);
					console.log(`${plobj.name} of ID: ${plobj.id}'s rating increased to ${plobj.current_rating}`);
				}
			});
		});
	}
});

client.login(config.token);