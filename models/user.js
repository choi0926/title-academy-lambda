module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
      'User',
      {
        email: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        nickname: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        profile: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
        refreshToken: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        authCode:{
          type: DataTypes.STRING(200),
          allowNull: true,
          tableName: 'user',
        }
      },
      {
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timestamps: false,
      },
    );
    User.associate = (db) => {
      db.User.hasMany(db.Post);
      db.User.hasMany(db.Comment);
    };
    return User;
  };