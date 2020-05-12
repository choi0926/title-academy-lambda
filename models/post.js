module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define(
      'Post',
      {
        category: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        subject: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        recommend: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        views: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          tableName: 'post'
        },
      },
      {
        charset: 'utf8mb4', //한글 + 이모티콘
        collate: 'utf8mb4_general_ci',
        timestamps: true,
      },
    );
  
    Post.associate = (db) => {
      db.Post.belongsTo(db.User);
      db.Post.hasMany(db.Image);
      db.Post.hasMany(db.Comment);
    };
    return Post;
  };
  