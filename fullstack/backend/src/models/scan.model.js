const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Scan extends Model {
    static associate(models) {
      Scan.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  Scan.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      object_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      object_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ripeness_level: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      is_consumable: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      recommendation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      raw_response: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Scan',
      tableName: 'scans',
      timestamps: true,
    },
  );

  return Scan;
};
