const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Knowledge extends Model {
    static associate() {}
  }

  Knowledge.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      tags: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      source: {
        type: DataTypes.ENUM('manual', 'scan', 'chat'),
        allowNull: false,
        defaultValue: 'manual',
      },
      source_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Knowledge',
      tableName: 'knowledges',
      timestamps: true,
    },
  );

  return Knowledge;
};
