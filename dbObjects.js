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

const Managers = sequelize.import('models/Managers');
const TransferMarket = sequelize.import('models/TransferMarket');
const TeamPlayers = sequelize.import('models/TeamPlayers');
const Results = sequelize.import('models/Results');
const Clubs = sequelize.import('models/Clubs');
const YouthFacilities = sequelize.import('models/YouthFacilities');

TeamPlayers.belongsTo(TransferMarket, { foreignKey: 'player_id', as: 'player' });

Managers.prototype.addItem = async function (player) {
	const teamPlayer = await TeamPlayers.findOne({
		where: { manager_id: this.manager_id, player_id: player.id },
	});

	if (teamPlayer) {
		return teamPlayer.save();
	}

	return TeamPlayers.create({ manager_id: this.manager_id, player_id: player.id, amount: 1});
};

Managers.prototype.getItems = function () {
	return TeamPlayers.findAll({
		where: { manager_id: this.manager_id },
		include: ['player'],
	});
};

module.exports = { Managers, TransferMarket, TeamPlayers, Results, Clubs, YouthFacilities };