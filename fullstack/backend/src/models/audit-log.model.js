const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  AuditLog.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      action: { type: DataTypes.STRING(50), allowNull: false },
      entity: { type: DataTypes.STRING(50), allowNull: false },
      entity_id: { type: DataTypes.INTEGER, allowNull: true },
      details: { type: DataTypes.TEXT, allowNull: true },
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: true,
    },
  );

  return AuditLog;
};
