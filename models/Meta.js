module.exports = (sequelize, DataTypes) => {
	return sequelize.define('meta', {
		season: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
		},


	}, {
		timestamps: false,
	});
};