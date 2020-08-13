module.exports = (sequelize, DataTypes) => {
	return sequelize.define('results', {
		team: {
			type: DataTypes.STRING,			
		},
		opposition: {
			type: DataTypes.STRING,			
		},
		match_type: {
			type: DataTypes.STRING,
		},
		league_season: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		match_date: {
			type: DataTypes.STRING,
		},
		result: {
			type: DataTypes.STRING,
		},
		goals_for: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		goals_against: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	}, {
		timestamps: true,
	});
};