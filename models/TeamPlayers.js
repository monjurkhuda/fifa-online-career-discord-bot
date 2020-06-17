module.exports = (sequelize, DataTypes) => {
	return sequelize.define('team_players', {
		manager_id: DataTypes.STRING,
		player_id: DataTypes.STRING,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};