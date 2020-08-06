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

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const init = [
		Clubs.upsert({ name: 'Manchester United', short_name:'ManUtd', balance: 900000000 }),
		Clubs.upsert({ name: 'Liverpool', short_name: 'Liverpool', balance: 900000000 }),
		Clubs.upsert({ name: 'Manchester City', short_name: 'ManCity', balance: 900000000 }),
		Clubs.upsert({ name: 'Real Madrid', short_name: 'Madrid', balance: 900000000 }),
		Clubs.upsert({ name: 'FC Barcelona', short_name: 'Barcelona', balance: 900000000 }),
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
		YouthCoaches.upsert({ name: 'Unai Emery', level: 1, wage: 100000 })
	];
	await Promise.all(init);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);