module.exports = (sequelize, DataTypes) => {
	return sequelize.define('transfer_market', {
		name: {
			type: DataTypes.STRING,			
		},
		club: {
			type: DataTypes.STRING,
			defaultValue: 'Free Agent',
		},
		nation: {
			type: DataTypes.STRING,			
		},
		age: {
			type: DataTypes.INTEGER,
		},
		position: {
			type: DataTypes.INTEGER,
		},
		current_rating: {
			type: DataTypes.INTEGER,			
		},
		potential_rating: {
			type: DataTypes.INTEGER,			
		},
		manager_id: {
			type: DataTypes.INTEGER,
		},
		agent: {
			type: DataTypes.STRING,			
		},
		value: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		wage: {
			type: DataTypes.INTEGER,
		},
		release_clause: {
			type: DataTypes.INTEGER,
		},
		information: {
			type: DataTypes.STRING,
		},
		dislikes_manager: {
			type: DataTypes.STRING,
		},
		happiness: {
			type: DataTypes.INTEGER,
			defaultValue: 100,
		},
		transfer_status: {
			type: DataTypes.STRING,
			defaultValue: 'Not For Sale',
		},
		injured_until: {
			type: DataTypes.STRING,
		},
		loan_club: {
			type: DataTypes.STRING,
		},
		loan_end: {
			type: DataTypes.STRING,
		},
		favored_club: {
			type: DataTypes.STRING,
		},
		original_eightyfive_plus: {
			type: DataTypes.INTEGER,
		},
	}, {
		timestamps: false,
	});
};