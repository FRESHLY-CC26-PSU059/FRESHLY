'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scans', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      object_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      object_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      ripeness_level: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      is_consumable: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      raw_response: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('scans', ['user_id']);
    await queryInterface.addIndex('scans', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('scans');
  },
};
