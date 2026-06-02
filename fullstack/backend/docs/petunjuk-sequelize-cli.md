# Petunjuk Backend (Sequelize CLI)

Dokumen ini berisi command yang dipakai di project ini setelah migrasi ke full Sequelize CLI.

## 1. Masuk folder backend

Jalankan semua command dari folder backend:

```powershell
cd D:\freshly\backend
```

## 2. Jalankan server

```powershell
npm run dev
```

Atau mode normal:

```powershell
npm run start
```

## 3. Migration

### Buat file migration baru (timestamp otomatis)

```powershell
npx sequelize-cli migration:generate --name nama-migration
```

Contoh:

```powershell
npx sequelize-cli migration:generate --name create-products-table
```

### Jalankan migration

```powershell
npx sequelize-cli db:migrate
```

### Undo migration terakhir

```powershell
npx sequelize-cli db:migrate:undo
```

### Undo semua migration

```powershell
npx sequelize-cli db:migrate:undo:all
```

## 4. Seeder

### Buat file seeder baru (timestamp otomatis)

```powershell
npx sequelize-cli seed:generate --name nama-seeder
```

Contoh:

```powershell
npx sequelize-cli seed:generate --name seed-products
```

### Jalankan semua seeder

```powershell
npx sequelize-cli db:seed:all
```

### Undo semua seeder

```powershell
npx sequelize-cli db:seed:undo:all
```

## 5. Script npm setara

Kamu juga bisa pakai script berikut dari package.json:

```powershell
npm run migrate:create -- nama-migration
npm run migrate:up
npm run migrate:down
npm run migrate:reset
npm run seed:create -- nama-seeder
npm run seed
npm run seed:undo
```

## 6. Catatan penting

- File path Sequelize CLI sudah diarahkan ke src lewat .sequelizerc.
- Migration ada di src/migrations.
- Seeder ada di src/seeders.
- Config CLI ada di src/config/sequelize-cli.js.
- Pastikan DATABASE_URL di file .env valid.
