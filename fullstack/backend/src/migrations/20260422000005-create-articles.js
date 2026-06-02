'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('articles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      excerpt: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tags: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('articles', ['slug'], { unique: true });
    await queryInterface.addIndex('articles', ['author_id']);
    await queryInterface.addIndex('articles', ['published']);
    await queryInterface.addIndex('articles', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('articles');
  },
};
