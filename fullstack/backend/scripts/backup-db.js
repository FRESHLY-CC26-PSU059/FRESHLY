const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'capstone_db',
};

// Keep backups outside src/migrations so sequelize-cli doesn't try to run them.
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

console.log('Creating database backup...');
console.log(`File: ${backupFile}`);

// Password travels via env so it never lands in argv / shell history / ps.
const env = { ...process.env, PGPASSWORD: dbConfig.password || '' };

const result = spawnSync(
  'pg_dump',
  [
    '-h', dbConfig.host,
    '-p', String(dbConfig.port),
    '-U', dbConfig.user,
    '-d', dbConfig.database,
    '-f', backupFile,
  ],
  { env, stdio: 'inherit', shell: false },
);

if (result.error) {
  console.error('Backup failed to spawn pg_dump:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`pg_dump exited with status ${result.status}`);
  process.exit(result.status || 1);
}

console.log('Backup created successfully.');
