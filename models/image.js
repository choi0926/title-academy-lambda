module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define(
      'Image',
      {
        UserId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        src: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          tableName: 'image'
        },
      },
      {
        charset: 'utf8', //한글 
        collate: 'utf8_general_ci',
        timestamps: true,
      },
    );
    Image.associate = (db) => {
      db.Image.belongsTo(db.Post);
    };
    return Image;
  };
  