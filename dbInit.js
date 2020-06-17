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
sequelize.import('models/TeamPlayers');
sequelize.import('models/Results');
sequelize.import('models/YouthFacilities');
const Clubs = sequelize.import('models/Clubs');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const init = [
		TransferMarket.upsert({ name: 'K. Mbappe', value: 935, club: 'PSG', position: 'RW', current_rating: 89, age: 23, wage: 300000 }),
		TransferMarket.upsert({ name: 'J. Sancho', value: 635, club: 'Dotmund', position: 'RW', current_rating: 87, age: 20, wage: 250000 }),
		TransferMarket.upsert({ name: 'L. Messi', value: 955, club: 'Barcelona', position: 'ST', current_rating: 94, age: 33, wage: 400000 }),
		TransferMarket.upsert({ name: 'M. Dembele', value: 550, club: 'Olympique Lyonnais', position: 'ST', current_rating: 82, age: 22, wage: 100000 }),
		TransferMarket.upsert({ name: 'M. Dembele', value: 250, club: 'Guangzhou R&F FC', position: 'CM', current_rating: 80, age: 31, wage: 20000 }),
		Clubs.upsert({ name: 'ManUtd', balance: 500000000 }),
		Clubs.upsert({ name: 'Liverpool', balance: 200000000 })		
	];
	await Promise.all(init);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);