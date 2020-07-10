module.exports = (sequelize, DataTypes) => {
	return sequelize.define('youth_coaches', {
		club: {
			type: DataTypes.STRING,
			defaultValue: 'Unemployed',
		},
		name: {
			type: DataTypes.STRING,
		},
		level: {
			type: DataTypes.INTEGER,
		},
		wage: {
			type: DataTypes.INTEGER,
		},
	}, {
		timestamps: false,
	});
};