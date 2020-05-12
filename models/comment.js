module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define(
      'Comment',
      {
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
          tableName: 'comment'
  
        },
      },
      {
        charset: 'utf8mb4', //한글 + 이모티콘
        collate: 'utf8mb4_general_ci',
        timestamps: true,
      },
    );
    Comment.associate = (db) => {
      db.Comment.belongsTo(db.User);
      db.Comment.belongsTo(db.Post);
    };
    return Comment;
  };
  