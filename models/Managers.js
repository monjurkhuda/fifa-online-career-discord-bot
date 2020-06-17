module.exports = (sequelize, DataTypes) => {
	return sequelize.define('managers', {
		manager_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		club: {
			type: DataTypes.STRING,
			defaultValue: 'unemployed',
		},
		league_trophies: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		cup_trophies: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	}, {
		timestamps: false,
	});
};