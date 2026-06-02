'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const roles = ['super_admin', 'admin', 'user'];

    for (const role_name of roles) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE role_name = :role_name LIMIT 1;`,
        { replacements: { role_name } },
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('roles', [
          {
            role_name,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', {
      role_name: ['super_admin', 'admin', 'user'],
    });
  },
};
