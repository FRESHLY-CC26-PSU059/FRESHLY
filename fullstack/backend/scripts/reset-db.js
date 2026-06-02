const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSsl = process.env.PG_SSL === 'true' || process.env.PG_HOST?.includes('supabase');

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  }
);

const grantIfExists = async (roleName) => {
  const [roles] = await sequelize.query('SELECT 1 FROM pg_roles WHERE rolname = $1', {
    bind: [roleName],
  });

  if (roles.length > 0) {
    await sequelize.query(`GRANT ALL ON SCHEMA public TO "${roleName.replace(/"/g, '""')}";`);
  }
};

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
    await grantIfExists('postgres');
    await grantIfExists('anon');
    await grantIfExists('authenticated');
    await grantIfExists('service_role');
    
    console.log('✅ Database reset successfully!');
    console.log('📝 Now run: npm run migrate && npm run seed:admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetDatabase();
