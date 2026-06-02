'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('knowledges', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      tags: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      source: {
        type: Sequelize.ENUM('manual', 'scan', 'chat'),
        allowNull: false,
        defaultValue: 'manual',
      },
      source_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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

    await queryInterface.addIndex('knowledges', ['category']);
    await queryInterface.addIndex('knowledges', ['enabled']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('knowledges');
  },
};
