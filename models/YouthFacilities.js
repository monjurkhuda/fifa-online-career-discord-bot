module.exports = (sequelize, DataTypes) => {
	return sequelize.define('youth_facilities', {
		team: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		coach_one: {
			type: DataTypes.STRING,
		},
		coach_one_level: {
			type: DataTypes.INTEGER,
		},
		coach_two: {
			type: DataTypes.STRING,
		},
		coach_two_level: {
			type: DataTypes.INTEGER,
		},
		coach_three: {
			type: DataTypes.STRING,
		},
		coach_three_level: {
			type: DataTypes.INTEGER,
		},
		coach_four: {
			type: DataTypes.STRING,
		},
		coach_four_level: {
			type: DataTypes.INTEGER,
		},
		facility_quality: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
		},
	}, {
		timestamps: false,
	});
};