'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@freshly.id';
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";

    if (!password) {
      throw new Error(
        'SEED_ADMIN_PASSWORD is required. Set it to a value ≥ 8 characters before seeding.',
      );
    }
    if (password.length < 8) {
      throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters long.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = :email LIMIT 1;`,
      { replacements: { email } },
    );
    if (existing.length > 0) {
      // Update password and unlock account for existing admin user
      await queryInterface.sequelize.query(
        `UPDATE users SET password = :password, "failedLoginAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = :updatedAt WHERE email = :email;`,
        { replacements: { email, password: hashedPassword, updatedAt: new Date() } }
      );
      return;
    }

    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE role_name = 'super_admin' LIMIT 1;`
    );
    if (!roles.length) {
      throw new Error('super_admin role not found — run seed-roles-master first');
    }

    const roleId = roles[0].id;

    await queryInterface.bulkInsert('users', [
      {
        first_name: process.env.SEED_ADMIN_FIRST_NAME || 'Super',
        last_name: process.env.SEED_ADMIN_LAST_NAME || 'Admin',
        email,
        password: hashedPassword,
        role_id: roleId,
        isActive: true,
        isEmailVerified: true,
        failedLoginAttempts: 0,
        otpAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@freshly.id';
    await queryInterface.bulkDelete('users', { email });
  },
};
