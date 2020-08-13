const Sequelize = require('sequelize');

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const TransferMarket = sequelize.import('models/TransferMarket');
sequelize.import('models/Managers');
sequelize.import('models/Results');
sequelize.import('models/YouthFacilities');
const Clubs = sequelize.import('models/Clubs');
const YouthCoaches = sequelize.import('models/YouthCoaches');
const LeagueTable = sequelize.import('models/LeagueTable');
const Meta = sequelize.import('models/Meta');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const init = [
		Clubs.upsert({ name: 'Manchester United', short_name:'ManUtd', balance: 900000000 }),
		Clubs.upsert({ name: 'Liverpool', short_name: 'Liverpool', balance: 900000000 }),
		Clubs.upsert({ name: 'Manchester City', short_name: 'ManCity', balance: 900000000 }),
		Clubs.upsert({ name: 'Real Madrid', short_name: 'Madrid', balance: 900000000 }),
		Clubs.upsert({ name: 'FC Barcelona', short_name: 'Barcelona', balance: 900000000 }),
		Clubs.upsert({ name: 'Inter', short_name: 'Inter', balance: 900000000 }),
		Clubs.upsert({ name: 'Juventus', short_name: 'Juventus', balance: 900000000 }),
		Clubs.upsert({ name: 'Paris Saint-Germain', short_name: 'PSG', balance: 900000000 }),
		Clubs.upsert({ name: 'FC Bayern Munchen', short_name: 'Bayern', balance: 900000000 }),
		Clubs.upsert({ name: 'Atletico Madrid', short_name: 'Atletico', balance: 900000000 }),
		Clubs.upsert({ name: 'Tottenham Hotspur', short_name: 'Tottenham', balance: 900000000 }),
		Clubs.upsert({ name: 'Borussia Dortmund', short_name: 'Dortmund', balance: 900000000 }),
		Clubs.upsert({ name: 'Chelsea', short_name: 'Chelsea', balance: 900000000 }),
		Clubs.upsert({ name: 'Arsenal', short_name: 'Arsenal', balance: 900000000 }),
		Clubs.upsert({ name: 'Milan', short_name: 'Milan', balance: 900000000 }),

		YouthCoaches.upsert({ name: 'Alex Ferguson', level: 5, wage: 500000 }),
		YouthCoaches.upsert({ name: 'Matt Busby', level: 5, wage: 500000 }),
		YouthCoaches.upsert({ name: 'Bob Paisley', level: 5, wage: 500000 }),
		YouthCoaches.upsert({ name: 'Arrigo Sacchi', level: 5, wage: 500000 }),
		YouthCoaches.upsert({ name: 'Johan Cruyff', level: 4, wage: 400000 }),	
		YouthCoaches.upsert({ name: 'Bill Shankly', level: 4, wage: 400000 }),
		YouthCoaches.upsert({ name: 'Pep Guardiola', level: 4, wage: 400000 }),
		YouthCoaches.upsert({ name: 'Jurgen Klopp', level: 4, wage: 400000 }),
		YouthCoaches.upsert({ name: 'Arsene Wenger', level: 3, wage: 300000 }),
		YouthCoaches.upsert({ name: 'Brian Clough', level: 3, wage: 300000 }),
		YouthCoaches.upsert({ name: 'Antonio Conte', level: 3, wage: 300000 }),
		YouthCoaches.upsert({ name: 'Zinedine Zidane', level: 3, wage: 300000 }),
		YouthCoaches.upsert({ name: 'Fabio Capello', level: 2, wage: 200000 }),
		YouthCoaches.upsert({ name: 'Louis Van Gaal', level: 2, wage: 200000 }),
		YouthCoaches.upsert({ name: 'Jose Mourinho', level: 2, wage: 200000 }),
		YouthCoaches.upsert({ name: 'Jupp Heynckes', level: 2, wage: 200000 }),
		YouthCoaches.upsert({ name: 'Sam Allardyce', level: 1, wage: 100000 }),
		YouthCoaches.upsert({ name: 'David Moyes', level: 1, wage: 100000 }),
		YouthCoaches.upsert({ name: 'Alan Pardew', level: 1, wage: 100000 }),
		YouthCoaches.upsert({ name: 'Unai Emery', level: 1, wage: 100000 }),

		LeagueTable.upsert({ name: 'Manchester United', short_name: 'ManUtd' }),
		LeagueTable.upsert({ name: 'Liverpool', short_name: 'Liverpool' }),
		LeagueTable.upsert({ name: 'Manchester City', short_name: 'ManCity' }),
		LeagueTable.upsert({ name: 'Real Madrid', short_name: 'Madrid' }),
		LeagueTable.upsert({ name: 'FC Barcelona', short_name: 'Barcelona' }),
		LeagueTable.upsert({ name: 'Inter', short_name: 'Inter' }),
		LeagueTable.upsert({ name: 'Juventus', short_name: 'Juventus' }),
		LeagueTable.upsert({ name: 'Paris Saint-Germain', short_name: 'PSG' }),
		LeagueTable.upsert({ name: 'FC Bayern Munchen', short_name: 'Bayern' }),
		LeagueTable.upsert({ name: 'Atletico Madrid', short_name: 'Atletico' }),
		LeagueTable.upsert({ name: 'Tottenham Hotspur', short_name: 'Tottenham' }),
		LeagueTable.upsert({ name: 'Borussia Dortmund', short_name: 'Dortmund' }),
		LeagueTable.upsert({ name: 'Chelsea', short_name: 'Chelsea' }),
		LeagueTable.upsert({ name: 'Arsenal', short_name: 'Arsenal' }),
		LeagueTable.upsert({ name: 'Milan', short_name: 'Milan' }),

		Meta.upsert({ season: 1 })
	];
	await Promise.all(init);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);