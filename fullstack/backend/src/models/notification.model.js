const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'info',
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: true,
      underscored: true,
    },
  );

  Notification.prototype.toJSON = function () {
    const values = { ...this.get() };
    values.body = values.message;
    values.isRead = values.is_read;
    values.createdAt = values.created_at || values.createdAt;
    values.updatedAt = values.updated_at || values.updatedAt;
    values.userId = values.user_id;
    return values;
  };

  return Notification;
};
