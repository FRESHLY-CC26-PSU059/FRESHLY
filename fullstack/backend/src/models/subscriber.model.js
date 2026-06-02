const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subscriber extends Model {}

  Subscriber.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'isActive' },
    },
    {
      sequelize,
      modelName: 'Subscriber',
      tableName: 'subscribers',
      timestamps: true,
    },
  );

  return Subscriber;
};
