module.exports = (sequelize, DataTypes) => {
	return sequelize.define('league_table', {
		season: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
		},		
		name: {
			type: DataTypes.STRING,
		},
		short_name: {
			type: DataTypes.STRING,
		},
		league_points: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		played: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		win: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		loss: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		draw: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
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
		timestamps: false,
	});
};