# LMS - Learning Management System

Aplikasi web untuk manajemen kelas dan tugas. Guru dapat membuat tugas, murid mengumpulkan jawaban, dan guru memberikan penilaian. Akses dibatasi berdasarkan role dan keanggotaan kelas.

## Tech Stack

| Layer     | Teknologi          |
| --------- | ------------------ |
| Frontend  | Nuxt.js (Vue 3)    |
| Backend   | Elysia.js + Bun    |
| Database  | PostgreSQL         |
| Bahasa    | TypeScript         |

## Persyaratan

- [Bun](https://bun.sh/) >= 1.1
- [Node.js](https://nodejs.org/) >= 18 (untuk tooling Nuxt)
- [PostgreSQL](https://www.postgresql.org/) >= 15

## Struktur Proyek

```
├── apps/
│   ├── api/                  # Backend Elysia.js + Bun
│   │   ├── drizzle/          # Generated SQL migration files
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── connection.ts   # Client PostgreSQL & Drizzle instance
│   │   │   │   ├── schema.ts       # 6 skema tabel & relasi Drizzle ORM
│   │   │   │   ├── migrate.ts      # Script migrator
│   │   │   │   └── seed.ts         # Script seeder akun Admin awal
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts # Session context, requireAuth, requireRoles
│   │   │   ├── modules/
│   │   │   │   └── auth/           # Login, Logout, /me, & Session utils
│   │   │   ├── plugins/
│   │   │   │   └── error.plugin.ts # Global error & validation handler
│   │   │   ├── utils/
│   │   │   │   └── errors.ts       # AppError hierarchy
│   │   │   └── index.ts            # Entry point API
│   │   ├── tests/
│   │   │   ├── auth.test.ts        # Test autentikasi & RBAC guards
│   │   │   ├── health.test.ts      # Test endpoint health
│   │   │   └── schema.test.ts      # Test skema Drizzle & hashing Argon2id
│   │   └── drizzle.config.ts
│   └── web/                  # Frontend Nuxt.js
│       ├── app/
│       │   ├── pages/
│       │   └── app.vue
│       └── nuxt.config.ts
├── .env.example              # Template environment variables
├── package.json              # Root monorepo config
└── README.md
```

## Instalasi

### 1. Clone repository

```bash
git clone <repository-url>
cd lms-project
```

### 2. Install dependencies

```bash
bun install
```

Perintah ini akan menginstal dependensi untuk root, `apps/api`, dan `apps/web` sekaligus (workspace).

### 3. Konfigurasi environment

Salin file `.env.example` ke `.env` dan sesuaikan nilainya:

```bash
cp .env.example .env
```

Variabel yang perlu diatur:

| Variabel           | Deskripsi                                 | Contoh                                              |
| ------------------ | ----------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`     | Connection string PostgreSQL              | `postgresql://postgres:password@localhost:5432/lms_dev` |
| `SESSION_SECRET`   | Secret untuk session (random string)      | `ubah-ke-string-random-yang-panjang`               |
| `API_PORT`         | Port untuk API backend                    | `3001`                                              |
| `WEB_ORIGIN`       | URL frontend (untuk CORS)                 | `http://localhost:3000`                             |
| `UPLOAD_MAX_BYTES` | Batas ukuran file upload (bytes)          | `10485760` (10 MB)                                  |
| `UPLOAD_DIR`       | Direktori penyimpanan file upload         | `./uploads`                                         |
| `NODE_ENV`         | Environment                               | `development`                                       |

### 4. Setup database & Migrasi

1. Pastikan PostgreSQL berjalan dan buat database:

```sql
CREATE DATABASE lms_dev;
```

2. Jalankan migrasi skema tabel (Drizzle ORM):

```bash
bun run db:migrate
```

3. (Opsional) Jalankan seeder akun Admin awal:

```bash
bun run db:seed
```
Default kredensial admin awal:
- Email: `admin@lms.local`
- Password: `Admin123!` (di-hash dengan Argon2id)

4. (Opsional) Buka Drizzle Studio untuk inspeksi visual tabel DB:

```bash
cd apps/api && bun run db:studio
```

## Menjalankan Aplikasi

### Backend (API)

```bash
cd apps/api
bun run dev
```

API berjalan di `http://localhost:3001`. Cek status di `http://localhost:3001/api/health`.

### Frontend (Web)

```bash
cd apps/web
bun run dev
```

Frontend berjalan di `http://localhost:3000`.

### Menjalankan keduanya dari root

```bash
# Backend saja
bun run dev:api

# Frontend saja
bun run dev:web
```

## API Endpoints

Prefix: `/api/v1`

### Autentikasi

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Publik | Validasi email & password, membuat session token di DB, mengembalikan cookie `lms_session` (HttpOnly). |
| `POST` | `/api/v1/auth/logout` | Login | Menghapus session dari DB dan menghapus cookie session. |
| `GET` | `/api/v1/auth/me` | Login | Mengembalikan profil pengguna yang sedang login (`id`, `name`, `email`, `role`). |

### Admin: Manajemen Akun (`/api/v1/admin/users`)

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | Admin | Daftar akun dengan pagination (`page`, `limit`), filter role (`ADMIN`, `TEACHER`, `STUDENT`), dan pencarian (`search`). |
| `POST` | `/api/v1/admin/users` | Admin | Membuat akun baru dengan hashing Argon2id. |
| `GET` | `/api/v1/admin/users/:userId` | Admin | Detail akun spesifik. |
| `PATCH` | `/api/v1/admin/users/:userId` | Admin | Mengubah nama, role, atau status keaktifan user. |
| `POST` | `/api/v1/admin/users/:userId/deactivate` | Admin | Menonaktifkan akun dan mencabut semua sesi aktif user. |

### Admin: Manajemen Kelas & Anggota (`/api/v1/admin/classes`)

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/admin/classes` | Admin | Daftar kelas dengan pagination (`page`, `limit`), filter status (`ACTIVE`, `ARCHIVED`), dan pencarian nama. |
| `POST` | `/api/v1/admin/classes` | Admin | Membuat kelas baru (`name`, `description`). |
| `GET` | `/api/v1/admin/classes/:classId` | Admin | Detail kelas spesifik beserta identitas pembuat. |
| `PATCH` | `/api/v1/admin/classes/:classId` | Admin | Mengubah nama, deskripsi, atau status kelas. |
| `PUT` | `/api/v1/admin/classes/:classId/teachers` | Admin | Mengatur daftar guru kelas (validasi role `TEACHER` dalam transaksi DB). |
| `PUT` | `/api/v1/admin/classes/:classId/students` | Admin | Mengatur daftar murid kelas (validasi role `STUDENT` dalam transaksi DB). |
| `GET` | `/api/v1/admin/classes/:classId/members` | Admin | Melihat seluruh anggota kelas (guru dan murid). |

### Kelas Guru & Murid (`/api/v1/classes`)

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/classes` | Guru/Murid | Daftar kelas yang diikuti oleh pengguna saat ini (berdasarkan `class_memberships`). |
| `GET` | `/api/v1/classes/:classId` | Anggota Kelas | Detail kelas dan daftar guru pengajar (ditolak jika bukan anggota). |
| `GET` | `/api/v1/classes/:classId/members` | Guru Kelas | Melihat daftar anggota kelas (khusus guru yang ditugaskan). |

### Tugas (`/api/v1/classes/:classId/assignments` & `/api/v1/assignments`)

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/classes/:classId/assignments` | Anggota Kelas | Daftar tugas di kelas (murid hanya melihat tugas non-arsip). |
| `POST` | `/api/v1/classes/:classId/assignments` | Guru Kelas | Membuat tugas baru dengan judul, deskripsi, dan tenggat waktu (`dueAt`). |
| `GET` | `/api/v1/assignments/:assignmentId` | Anggota Kelas | Detail tugas dan status pengerjaan pribadi (jika murid). |
| `PATCH` | `/api/v1/assignments/:assignmentId` | Guru Kelas | Mengubah judul, deskripsi, atau batas waktu tugas. |
| `POST` | `/api/v1/assignments/:assignmentId/archive` | Guru Kelas | Mengarsipkan tugas. |

### Submission & Penilaian (`/api/v1/submissions`)

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/v1/assignments/:assignmentId/my-submission` | Murid | Melihat submission diri sendiri untuk tugas terkait. |
| `PUT` | `/api/v1/assignments/:assignmentId/my-submission` | Murid | Mengirim/memperbarui submission teks atau file sebelum tenggat (revisi mereset nilai lama). |
| `GET` | `/api/v1/assignments/:assignmentId/submissions` | Guru Kelas | Daftar submission seluruh murid untuk tugas terkait. |
| `GET` | `/api/v1/submissions/:submissionId` | Pemilik / Guru Kelas | Detail jawaban dan hasil penilaian submission. |
| `PATCH` | `/api/v1/submissions/:submissionId/grade` | Guru Kelas | Memberikan nilai numerik (0–100) dan komentar penilaian. |
| `GET` | `/api/v1/submissions/:submissionId/file` | Pemilik / Guru Kelas | Mengunduh berkas jawaban aman (streaming setelah otorisasi). |

## Health Check

Endpoint `GET /api/health` mengembalikan status API dan koneksi database:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "api": true,
    "database": true
  }
}
```

## Testing

### Backend

```bash
cd apps/api
bun test
```

## Lisensi

Proyek pembelajaran dan portofolio.
