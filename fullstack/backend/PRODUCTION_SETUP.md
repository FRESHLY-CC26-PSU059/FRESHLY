# Production Setup Guide

## Database Migration to Supabase

### Setup untuk Production (Vercel + Supabase)

**⚠️ PENTING: Jalankan migration ini dari Vercel environment, bukan local!**

**1. Di Vercel Dashboard, set Environment Variables untuk production branch:**

```
NODE_ENV=production
PORT=5000

PG_HOST=db.yitgtlytmcgbhcealabh.supabase.co
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=Untirta123$
PG_DATABASE=postgres

JWT_SECRET=<your-secret-here>
JWT_REFRESH_SECRET=<your-refresh-secret-here>
CLIENT_KEY=<your-client-key>
GEMINI_API_KEY=<your-gemini-key>
...dst
```

**2. Deploy production branch ke Vercel:**

```bash
git push origin production
```

**3. Setelah Vercel deployment berhasil, jalankan migration via Vercel CLI:**

```bash
# Install Vercel CLI (if not yet)
npm i -g vercel

# Login ke Vercel
vercel login

# Run migration di Vercel environment
vercel env pull
$env:NODE_ENV = "production"; npx sequelize-cli db:migrate

# Or run via Vercel remote:
vercel run "npx sequelize-cli db:migrate"
```

**OR 4. Setup Production Build di Vercel dengan postbuild script:**

Edit `package.json` di backend:
```json
{
  "scripts": {
    "build": "echo 'Backend build complete'",
    "start": "node src/server.js",
    "migrate:production": "NODE_ENV=production npx sequelize-cli db:migrate"
  }
}
```

Kemudian di Vercel Dashboard → Settings → Build & Deployment → Build Command, tambahkan:
```
npm run migrate:production && npm run build
```

**5. Verifikasi di Supabase Dashboard:**
- Buka https://app.supabase.com
- Login dengan akun Anda
- Buka project Freshly
- Check "SQL Editor" atau "Schemas" untuk verify tables ter-create

## Important Notes

✅ Production credentials sekarang tersimpan di:
- `.env` file (local dev) - **JANGAN di-commit ke Git**
- Vercel Environment Variables (production)

⚠️ SECURITY CHECKLIST: 
- [ ] `.env` file di `.gitignore`
- [ ] Jangan share credentials
- [ ] Selalu gunakan Vercel Environment Variables untuk production
- [ ] SSH keys di `.env` jangan ter-commit

🚀 Deployment Flow:
```
Local Development
    ↓
Git Push → GitHub (production branch) 
    ↓
Vercel (auto-detect & deploy) 
    ↓
Run migrations (via Vercel)
    ↓
Supabase Database Updated ✅
```

**Production Connection String:**
```
postgresql://postgres:Untirta123$@db.yitgtlytmcgbhcealabh.supabase.co:5432/postgres?sslmode=require
```

## Social Auth (OAuth) Configuration

Untuk mengaktifkan fitur Login dengan Google, GitHub, dan Microsoft, Anda perlu melakukan konfigurasi di masing-masing provider dan Firebase Console.

### 1. Microsoft Login (Azure Portal)
Jika Anda mendapatkan error `unauthorized_client`, pastikan konfigurasi berikut benar:
1. Pergi ke [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Klik **New Registration** atau pilih aplikasi yang sudah ada.
3. **Supported account types**: Pilih opsi ke-3: **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**. Ini sangat penting agar akun konsumen bisa masuk.
4. **Redirect URI**: Pilih platform 'Web' dan masukkan URL dari Firebase Console (biasanya `https://<your-project-id>.firebaseapp.com/__/auth/handler`).
5. Pergi ke **Certificates & secrets**, buat **New client secret**, dan simpan **Value**-nya.
6. Copy **Application (client) ID** dan **Client Secret Value** ke Firebase Console > Authentication > Microsoft.

### 2. GitHub Login (GitHub Settings)
1. Pergi ke **GitHub Developer Settings** > **OAuth Apps**.
2. Masukkan **Authorization callback URL** dari Firebase Console.
3. Copy **Client ID** dan **Client Secret** ke Firebase Console.

### 3. Firebase Console
Pastikan semua provider (Google, GitHub, Microsoft) sudah di-enable di tab **Sign-in method** dan kredensial (ID & Secret) sudah dimasukkan dengan benar.
