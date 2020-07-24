module.exports = (sequelize, DataTypes) => {
	return sequelize.define('clubs', {
		name: {
			type: DataTypes.STRING,
		},
		balance: {
			type: DataTypes.INTEGER,
		},
		weekly_expenditure: {
			type: DataTypes.INTEGER,
		},
		manager_id: {
			type: DataTypes.STRING,		
		},
		youth_coaches: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		youth_facility_level: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		youth_facilities_rating: {
			type: DataTypes.INTEGER,
		},
		league_trophies: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		cup_trophies: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		sheikh_win_50m: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		youth_spree: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		forced_formation: {
			type: DataTypes.INTEGER,			
		},
		forced_formation_games: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	}, {
		timestamps: false,
	});
};