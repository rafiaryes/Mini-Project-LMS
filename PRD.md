# Product Requirements Document (PRD)
## LMS Mini Project: Manajemen Kelas dan Tugas

**Status:** Draft awal untuk implementasi MVP  
**Versi:** 1.0  
**Bahasa:** Indonesia  
**Frontend:** Nuxt.js  
**Backend:** Elysia.js + Bun  
**Database:** PostgreSQL  
**Target:** Proyek pembelajaran dan portofolio full-stack

---

## 1. Ringkasan Produk

LMS ini adalah aplikasi web sederhana untuk membantu guru mengelola kelas dan tugas serta membantu murid melihat tugas, mengumpulkan jawaban, dan menerima penilaian. Sistem mendukung banyak kelas dan wajib membatasi akses berdasarkan role pengguna serta keanggotaan kelas.

Contoh utama: seorang guru dapat mengajar kelas A dan kelas B. Murid kelas A hanya dapat melihat tugas dan submission miliknya di kelas A, bukan data kelas B. Guru hanya dapat mengelola kelas yang ditugaskan kepadanya. Admin membuat akun dan mengelola kelas.

Keberhasilan proyek bukan hanya antarmuka yang berfungsi. Backend harus menolak akses lintas kelas, termasuk ketika pengguna memanggil endpoint API secara langsung atau mengganti ID pada URL.

## 2. Latar Belakang dan Masalah

Pengelolaan tugas melalui chat atau berkas yang tersebar dapat menyulitkan guru dan murid untuk mengetahui tugas aktif, tenggat, status pengumpulan, dan hasil penilaian. Aplikasi ini menyediakan satu tempat terpusat untuk mengelola proses tersebut.

Untuk tujuan portofolio, proyek ini juga menjadi latihan penerapan autentikasi, otorisasi, relasi database, unggah berkas, validasi input, API REST, dan pengujian keamanan akses.

## 3. Tujuan Produk

1. Guru dapat mengelola kelas yang ditugaskan kepadanya.
2. Guru dapat membuat, mengubah, dan menutup tugas pada kelas yang diajarnya.
3. Murid dapat melihat tugas hanya dari kelas yang diikutinya.
4. Murid dapat mengirim jawaban berupa teks, berkas, atau keduanya.
5. Guru dapat melihat submission murid di kelasnya, memberi nilai, dan menambahkan komentar.
6. Sistem menolak akses yang tidak sesuai dengan role, kelas, tugas, atau pemilik submission.
7. Proyek dapat dijalankan secara lokal dan memiliki dokumentasi yang cukup untuk direview perekrut.

## 4. Indikator Keberhasilan

- Semua skenario inti guru dan murid berhasil dijalankan dari UI.
- Seluruh pengujian akses lintas kelas yang ditentukan pada bagian pengujian berhasil ditolak oleh backend.
- Pengguna tidak dapat membaca, mengubah, menghapus, menilai, atau mengunduh submission yang bukan hak aksesnya.
- Berkas yang diunggah melewati validasi ukuran dan tipe berkas.
- API utama memiliki validasi input dan format respons/error yang konsisten.
- README menjelaskan instalasi, konfigurasi environment, migrasi database, akun demo, pengujian, dan cara menjalankan aplikasi.

## 5. Asumsi dan Keputusan Produk

Asumsi berikut dipakai untuk membuat ruang lingkup implementasi cukup jelas. Asumsi dapat direvisi sebelum atau selama pengembangan jika ada alasan yang kuat.

1. **Role akun bersifat tetap.** Setiap akun memiliki satu role global: `ADMIN`, `TEACHER`, atau `STUDENT`.
2. **Admin membuat akun.** Tidak ada pendaftaran mandiri pada MVP. Admin membuat akun guru dan murid, lalu kredensial awal disampaikan secara aman. Mekanisme reset kata sandi dapat menjadi fitur lanjutan.
3. **Admin mengelola kelas.** Admin membuat kelas, menetapkan guru, dan mendaftarkan murid sebagai anggota kelas.
4. **Guru dapat mengajar banyak kelas.** Seorang guru hanya boleh mengelola kelas yang secara eksplisit ditugaskan kepadanya.
5. **Murid dapat mengikuti banyak kelas.** Akses murid ditentukan oleh keanggotaan kelas.
6. **Submission satu per murid per tugas.** Murid dapat memperbarui submission sebelum tenggat. Setiap perubahan mengganti jawaban/berkas pada submission yang sama; riwayat revisi belum disimpan.
7. **Tenggat bersifat ketat.** Setelah waktu tenggat, murid tidak dapat membuat atau mengubah submission. Waktu disimpan dalam UTC dan ditampilkan sesuai zona waktu lokal browser.
8. **Penilaian:** guru memberi nilai numerik dan komentar. Skala nilai default 0–100.
9. **Jawaban:** murid dapat mengirim teks, berkas, atau keduanya. Submission harus memiliki setidaknya satu dari teks atau berkas.
10. **Status submission** diturunkan dari keadaan sistem, bukan dipilih bebas oleh pengguna. Status minimal: `NOT_SUBMITTED`, `SUBMITTED`, `LATE` tidak digunakan sebagai status penerimaan karena submission terlambat ditolak, dan `GRADED`. Pada implementasi, tugas yang telah lewat tenggat tanpa submission tetap dapat ditampilkan sebagai belum dikumpulkan.
11. **Penghapusan:** kelas yang sudah memiliki tugas atau submission sebaiknya diarsipkan, bukan dihapus permanen. Penghapusan permanen hanya untuk data yang belum memiliki relasi penting atau melalui prosedur admin yang jelas.
12. **Deployment belum ditentukan.** MVP harus berjalan lokal. Struktur konfigurasi harus mendukung deployment di kemudian hari.
13. **Tidak ada fitur super-admin terpisah.** Role `ADMIN` merupakan administrator aplikasi.
14. **Tidak ada chat, video conference, kuis otomatis, atau notifikasi email pada MVP.**

## 6. Pengguna dan Hak Akses

### 6.1 Admin

Admin bertanggung jawab atas konfigurasi dasar aplikasi.

- Membuat, melihat, memperbarui, dan menonaktifkan akun.
- Menentukan role akun saat pembuatan.
- Membuat dan memperbarui kelas.
- Menetapkan satu atau lebih guru ke kelas.
- Menambahkan dan mengeluarkan murid dari kelas.
- Melihat daftar kelas dan anggota untuk keperluan administrasi.
- Tidak dapat mengubah nilai atau submission sebagai guru kecuali fitur tersebut sengaja ditambahkan kemudian.

### 6.2 Guru

- Melihat dashboard dan kelas yang ditugaskan kepadanya.
- Melihat anggota kelas yang diajarnya.
- Membuat, melihat, dan memperbarui tugas di kelas yang diajarnya.
- Melihat submission dari murid yang terdaftar di kelasnya.
- Mengunduh berkas submission pada kelasnya.
- Memberi dan memperbarui nilai serta komentar.
- Tidak dapat membuat kelas atau menambahkan murid pada MVP.
- Tidak dapat mengakses kelas guru lain hanya dengan mengetahui ID kelas.

### 6.3 Murid

- Melihat dashboard dan kelas yang diikutinya.
- Melihat tugas pada kelas yang diikutinya.
- Melihat detail tugas, tenggat, dan status submission miliknya.
- Membuat atau memperbarui submission sebelum tenggat.
- Melihat nilai dan komentar untuk submission miliknya setelah dinilai.
- Tidak dapat melihat jawaban, berkas, atau nilai murid lain.
- Tidak dapat mengubah nilai atau komentar guru.

## 7. Ruang Lingkup MVP

### 7.1 Termasuk

- Login dan logout.
- Manajemen session.
- Dashboard berbeda untuk admin, guru, dan murid.
- Manajemen akun oleh admin.
- Manajemen kelas oleh admin.
- Penetapan guru dan anggota murid ke kelas oleh admin.
- Daftar kelas dan detail kelas sesuai hak akses.
- CRUD tugas dengan validasi tenggat.
- Submission berupa teks dan/atau berkas.
- Daftar submission untuk guru.
- Penilaian numerik dan komentar guru.
- Status tugas/submission.
- Validasi input dan error API konsisten.
- Pengujian unit/integrasi untuk aturan akses, terutama isolasi kelas.
- Dokumentasi setup lokal.

### 7.2 Tidak termasuk (Non-goals)

- Pendaftaran mandiri dan verifikasi email.
- Reset kata sandi otomatis melalui email.
- Multi-tenancy untuk banyak sekolah/organisasi.
- Chat, forum, video conference, atau kelas langsung.
- Kuis pilihan ganda atau ujian online.
- Penilaian otomatis berbasis AI.
- Notifikasi email, push notification, atau pengingat otomatis.
- Kalender akademik dan jadwal pelajaran.
- Riwayat revisi submission.
- Rubrik penilaian kompleks.
- Analitik pembelajaran lanjutan.
- Aplikasi mobile native.
- Pembayaran atau langganan.
- Integrasi SSO.

## 8. Alur Pengguna Utama

### 8.1 Alur Admin

1. Admin login.
2. Admin membuka halaman akun dan membuat akun guru atau murid.
3. Admin membuat kelas.
4. Admin menetapkan guru ke kelas.
5. Admin mendaftarkan murid sebagai anggota kelas.
6. Guru dan murid dapat mengakses kelas masing-masing setelah login.

### 8.2 Alur Guru

1. Guru login dan melihat dashboard kelas yang diajarnya.
2. Guru memilih kelas.
3. Guru membuat tugas dengan judul, deskripsi, tenggat, dan ketentuan berkas jika diperlukan.
4. Murid yang menjadi anggota kelas dapat melihat tugas.
5. Guru membuka daftar submission pada tugas.
6. Guru melihat jawaban/berkas, memberi nilai 0–100, dan menulis komentar.
7. Murid dapat melihat nilai dan komentar pada submission miliknya.

### 8.3 Alur Murid

1. Murid login dan melihat kelas yang diikutinya.
2. Murid membuka kelas lalu melihat daftar tugas.
3. Murid membuka detail tugas dan membaca deskripsi serta tenggat.
4. Sebelum tenggat, murid mengirim teks, berkas, atau keduanya.
5. Sistem menyimpan submission dan waktu pengiriman.
6. Murid melihat status pengumpulan.
7. Setelah guru memberi nilai, murid dapat melihat nilai dan komentar.

## 9. Aturan Bisnis

### Akun dan autentikasi

- Email harus unik dan dinormalisasi menjadi huruf kecil.
- Kata sandi disimpan sebagai hash kuat, bukan teks biasa.
- Akun nonaktif tidak dapat login.
- Role ditentukan oleh database, bukan oleh nilai yang dikirim frontend.
- Endpoint yang memerlukan login harus menolak request tanpa session valid.

### Kelas dan keanggotaan

- Setiap kelas memiliki ID unik dan status aktif/arsip.
- Satu kelas dapat memiliki beberapa guru dan banyak murid.
- Kombinasi `class_id` dan `user_id` pada tabel keanggotaan harus unik.
- Hanya admin yang dapat membuat kelas dan mengelola keanggotaannya pada MVP.
- Guru hanya dapat mengakses kelas jika ditugaskan pada kelas tersebut.
- Murid hanya dapat mengakses kelas jika terdaftar sebagai anggota aktif.
- Saat murid dikeluarkan dari kelas, akses berikutnya ke tugas dan berkas kelas tersebut ditolak. Kebijakan akses terhadap riwayat lama mengikuti aturan yang sama untuk mencegah kebocoran data.

### Tugas

- Tugas selalu dimiliki tepat satu kelas.
- Hanya guru yang ditugaskan pada kelas tersebut yang boleh membuat atau mengubah tugas.
- Judul wajib diisi; deskripsi dapat diwajibkan atau opsional secara konsisten di validasi.
- Tenggat harus berupa timestamp valid.
- Murid hanya dapat membaca tugas dari kelas yang diikutinya.
- Setelah tenggat, submission baru atau perubahan submission ditolak oleh backend.
- Perubahan tugas yang sudah memiliki submission perlu dibatasi. Perubahan tenggat atau deskripsi boleh dilakukan guru; perubahan yang mengubah konteks penilaian harus dihindari atau dicatat.

### Submission dan penilaian

- Satu murid memiliki maksimal satu submission aktif untuk setiap tugas.
- Submission hanya dapat dibuat oleh murid yang sedang login untuk dirinya sendiri.
- Klien tidak boleh menentukan `student_id` untuk mengirim submission atas nama orang lain.
- Submission harus berisi teks, satu berkas, atau keduanya.
- Jenis dan ukuran berkas diverifikasi di backend. Nama berkas asli tidak boleh digunakan langsung sebagai path penyimpanan.
- Guru hanya dapat melihat submission untuk tugas di kelas yang diajarnya.
- Hanya guru yang ditugaskan pada kelas tugas tersebut yang dapat menilai.
- Nilai harus berupa angka 0–100.
- Komentar penilaian dapat kosong, tetapi batas panjang harus diterapkan.
- Murid hanya dapat membaca nilai dan komentar miliknya.
- Submission yang sudah dinilai masih dapat diperbarui oleh guru. Jika murid dapat mengubah submission sebelum tenggat setelah penilaian, status penilaian sebaiknya kembali menjadi `SUBMITTED` dan nilai lama dibersihkan atau ditandai perlu dinilai ulang. Untuk MVP, gunakan aturan: setiap revisi oleh murid menghapus nilai dan komentar sebelumnya.

## 10. Model Data Awal

Gunakan UUID sebagai primary key. Nama tabel dan kolom berikut merupakan rancangan logis dan dapat disesuaikan dengan ORM yang dipilih.

### 10.1 `users`

- `id`: UUID, primary key.
- `name`: varchar, wajib.
- `email`: varchar, wajib, unik.
- `password_hash`: text, wajib.
- `role`: enum `ADMIN`, `TEACHER`, `STUDENT`.
- `is_active`: boolean, default true.
- `created_at`, `updated_at`: timestamp.

### 10.2 `sessions`

- `id`: UUID, primary key.
- `user_id`: UUID, foreign key ke `users`.
- `token_hash`: text, unik; simpan hash token sesi, bukan token mentah.
- `expires_at`: timestamp.
- `created_at`: timestamp.
- `last_seen_at`: timestamp, opsional.

### 10.3 `classes`

- `id`: UUID, primary key.
- `name`: varchar, wajib.
- `description`: text, opsional.
- `status`: enum `ACTIVE`, `ARCHIVED`.
- `created_by`: UUID, foreign key ke `users`.
- `created_at`, `updated_at`: timestamp.

### 10.4 `class_memberships`

- `id`: UUID, primary key.
- `class_id`: UUID, foreign key ke `classes`.
- `user_id`: UUID, foreign key ke `users`.
- `created_at`: timestamp.
- Unique constraint pada (`class_id`, `user_id`).

Role tidak perlu diulang pada tabel ini karena role akun bersifat tetap. Backend harus memastikan guru yang dimasukkan merupakan akun `TEACHER` dan murid yang dimasukkan merupakan akun `STUDENT`. Untuk implementasi sederhana, tabel ini dapat dipakai untuk keanggotaan guru dan murid, dengan role akun sebagai pembeda.

### 10.5 `assignments`

- `id`: UUID, primary key.
- `class_id`: UUID, foreign key ke `classes`.
- `created_by`: UUID, foreign key ke `users`.
- `title`: varchar, wajib.
- `description`: text, opsional.
- `due_at`: timestamp with time zone, wajib.
- `created_at`, `updated_at`: timestamp.
- `is_archived`: boolean, default false.

### 10.6 `submissions`

- `id`: UUID, primary key.
- `assignment_id`: UUID, foreign key ke `assignments`.
- `student_id`: UUID, foreign key ke `users`.
- `answer_text`: text, nullable.
- `file_key`: text, nullable.
- `original_file_name`: varchar, nullable.
- `mime_type`: varchar, nullable.
- `file_size_bytes`: bigint, nullable.
- `submitted_at`: timestamp with time zone.
- `grade`: numeric, nullable.
- `teacher_comment`: text, nullable.
- `graded_by`: UUID, nullable, foreign key ke `users`.
- `graded_at`: timestamp with time zone, nullable.
- `updated_at`: timestamp.
- Unique constraint pada (`assignment_id`, `student_id`).

Tambahkan constraint atau validasi aplikasi agar setidaknya `answer_text` atau `file_key` berisi nilai. Constraint database dapat dibuat untuk aturan ini.

### 10.7 Relasi inti

- `users` 1:N `sessions`.
- `users` M:N `classes` melalui `class_memberships`.
- `classes` 1:N `assignments`.
- `assignments` 1:N `submissions`.
- `users` 1:N `submissions` sebagai murid.
- `users` 1:N `assignments` sebagai pembuat tugas.
- `users` 1:N `submissions` sebagai pemberi nilai melalui `graded_by`.

**Catatan desain:** bila satu guru ditugaskan ke beberapa kelas, keanggotaannya direpresentasikan di `class_memberships`. Backend wajib memeriksa role dan keanggotaan, bukan sekadar memeriksa apakah ID pengguna tercatat di tabel tersebut.

## 11. Spesifikasi API Backend

Prefix API: `/api/v1`. Semua endpoint kecuali login harus membutuhkan autentikasi kecuali disebutkan sebaliknya. Format respons dan error harus konsisten.

Contoh respons sukses:

```json
{
  "data": {
    "id": "uuid",
    "name": "Kelas A"
  }
}
```

Contoh error:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Anda tidak memiliki akses ke resource ini."
  }
}
```

Gunakan status HTTP yang sesuai: `200` sukses, `201` dibuat, `204` sukses tanpa body, `400` input tidak valid, `401` belum terautentikasi, `403` tidak berhak, `404` resource tidak ditemukan atau sengaja disamarkan untuk mencegah enumerasi, `409` konflik, dan `413` berkas terlalu besar.

### 11.1 Autentikasi

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | `/auth/login` | Publik | Validasi kredensial dan membuat session |
| POST | `/auth/logout` | Login | Menghapus session saat ini |
| GET | `/auth/me` | Login | Mengembalikan profil dan role pengguna |

### 11.2 Admin: akun

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/admin/users` | Admin | Daftar akun dengan pagination dan filter |
| POST | `/admin/users` | Admin | Membuat akun |
| GET | `/admin/users/:userId` | Admin | Detail akun |
| PATCH | `/admin/users/:userId` | Admin | Mengubah nama, role, atau status sesuai aturan |
| POST | `/admin/users/:userId/deactivate` | Admin | Menonaktifkan akun |

MVP tidak menyediakan endpoint untuk mengambil kata sandi atau hash kata sandi. Hindari mengembalikan `password_hash` dalam semua respons.

### 11.3 Admin: kelas dan anggota

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/admin/classes` | Admin | Daftar semua kelas |
| POST | `/admin/classes` | Admin | Membuat kelas |
| GET | `/admin/classes/:classId` | Admin | Detail kelas |
| PATCH | `/admin/classes/:classId` | Admin | Mengubah data atau status kelas |
| PUT | `/admin/classes/:classId/teachers` | Admin | Mengatur daftar guru kelas |
| PUT | `/admin/classes/:classId/students` | Admin | Mengatur daftar murid kelas |
| GET | `/admin/classes/:classId/members` | Admin | Melihat anggota kelas |

Operasi pengaturan anggota harus memvalidasi role setiap user, menolak ID duplikat, dan menjalankan perubahan terkait dalam transaksi database.

### 11.4 Kelas

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/classes` | Guru/murid | Daftar kelas yang dapat diakses pengguna |
| GET | `/classes/:classId` | Guru/murid yang berhak | Detail kelas |
| GET | `/classes/:classId/members` | Guru pada kelas tersebut | Daftar anggota sesuai kebijakan privasi |

Endpoint umum tidak boleh mengembalikan semua kelas kepada guru atau murid. Filter harus diterapkan di query backend.

### 11.5 Tugas

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/classes/:classId/assignments` | Anggota kelas yang berhak | Daftar tugas kelas |
| POST | `/classes/:classId/assignments` | Guru yang ditugaskan | Membuat tugas |
| GET | `/assignments/:assignmentId` | Guru terkait atau murid anggota kelas | Detail tugas |
| PATCH | `/assignments/:assignmentId` | Guru terkait | Mengubah tugas |
| POST | `/assignments/:assignmentId/archive` | Guru terkait | Mengarsipkan tugas |

Untuk setiap endpoint tugas, backend harus menemukan kelas pemilik tugas lalu memvalidasi keanggotaan pengguna. Jangan mengandalkan `classId` dari frontend tanpa memverifikasinya terhadap data tugas.

### 11.6 Submission

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/assignments/:assignmentId/my-submission` | Murid anggota kelas | Melihat submission sendiri |
| PUT | `/assignments/:assignmentId/my-submission` | Murid anggota kelas, sebelum tenggat | Membuat atau mengganti submission sendiri |
| GET | `/assignments/:assignmentId/submissions` | Guru yang ditugaskan | Daftar submission tugas |
| GET | `/submissions/:submissionId` | Pemilik murid atau guru terkait | Detail submission sesuai akses |
| PATCH | `/submissions/:submissionId/grade` | Guru terkait | Memberi atau memperbarui nilai dan komentar |
| GET | `/submissions/:submissionId/file` | Pemilik murid atau guru terkait | Mengunduh berkas setelah otorisasi |

Unggah berkas dapat menggunakan `multipart/form-data`. Batasi ukuran berkas, tipe MIME, ekstensi yang diizinkan, dan nama file. Jangan mengembalikan path penyimpanan internal ke browser.

### 11.7 Aturan implementasi API

- Validasi request menggunakan schema Elysia sebelum menjalankan logika bisnis.
- Pisahkan route, service, akses database, dan utilitas penyimpanan berkas.
- Gunakan transaksi untuk operasi yang mengubah beberapa tabel.
- Terapkan pagination pada daftar akun, kelas, tugas, anggota, dan submission.
- Hindari query yang mengambil data lintas kelas lalu menyaringnya hanya di frontend.
- Jangan mempercayai `student_id`, `teacher_id`, `role`, `grade`, atau `class_id` yang tidak semestinya dapat ditentukan pengguna.
- Terapkan batas panjang string dan validasi tipe data.
- Gunakan logging untuk error operasional tanpa mencatat kata sandi, token sesi, atau isi submission sensitif.

## 12. Kebutuhan Frontend Nuxt.js

### 12.1 Halaman

| Halaman | Pengguna | Isi utama |
|---|---|---|
| `/login` | Semua role | Form login |
| `/dashboard` | Semua role | Ringkasan sesuai role |
| `/admin/users` | Admin | Daftar dan pembuatan akun |
| `/admin/classes` | Admin | Daftar, pembuatan, dan pengelolaan kelas |
| `/admin/classes/:id` | Admin | Detail kelas, guru, dan anggota |
| `/classes` | Guru/murid | Kelas yang dapat diakses |
| `/classes/:id` | Guru/murid | Detail kelas dan daftar tugas |
| `/assignments/:id` | Guru/murid yang berhak | Detail tugas |
| `/assignments/:id/submit` | Murid | Form jawaban teks dan berkas |
| `/assignments/:id/submissions` | Guru terkait | Daftar pengumpulan |
| `/submissions/:id` | Pemilik/guru terkait | Detail jawaban dan penilaian |

Halaman admin dapat dikembangkan setelah alur utama guru dan murid, tetapi tetap masuk ruang lingkup MVP karena akun dan kelas dibuat oleh admin.

### 12.2 Perilaku antarmuka

- Tampilkan loading, error, empty state, dan konfirmasi aksi yang relevan.
- Tampilkan tenggat dengan zona waktu lokal yang jelas.
- Nonaktifkan form submission setelah tenggat, tetapi tetap lakukan validasi di backend.
- Tampilkan status pengumpulan dan status penilaian secara terpisah bila diperlukan.
- Murid hanya melihat nilai dan komentar miliknya.
- Guru hanya melihat submission dari kelas yang diajarnya.
- Gunakan route middleware untuk pengalaman navigasi, bukan sebagai satu-satunya lapisan keamanan.
- Jangan menyimpan token autentikasi di `localStorage` pada pendekatan session cookie.
- Tangani `401` dengan mengarahkan pengguna ke login dan `403/404` dengan halaman yang sesuai.

## 13. Arsitektur dan Struktur Proyek

Struktur monorepo yang disarankan:

```text
lms-project/
├── apps/
│   ├── web/                 # Nuxt.js
│   │   ├── pages/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── middleware/
│   │   └── utils/
│   └── api/                 # Elysia.js + Bun
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── classes/
│       │   │   ├── assignments/
│       │   │   └── submissions/
│       │   ├── plugins/
│       │   ├── middleware/
│       │   ├── db/
│       │   ├── services/
│       │   └── index.ts
│       └── tests/
├── docs/
├── .env.example
├── README.md
└── package.json
```

Struktur ini adalah saran, bukan kewajiban. Hindari membuat abstraksi berlebihan sebelum ada kebutuhan nyata.

### Teknologi pendukung yang disarankan

- Nuxt.js untuk frontend.
- Elysia.js berjalan di Bun untuk API.
- PostgreSQL untuk database.
- ORM/query builder: pilih satu, misalnya Drizzle ORM atau Prisma, setelah memeriksa kompatibilitas versi Bun dan kebutuhan migrasi.
- Validasi schema Elysia untuk request/response.
- Hash kata sandi dengan algoritma yang sesuai seperti Argon2id atau bcrypt dengan konfigurasi yang memadai.
- Session acak berentropi tinggi; hanya hash token session disimpan di database.
- Penyimpanan berkas di balik interface/service agar penyedia storage dapat diganti.
- Pengujian dengan runner yang kompatibel dengan Bun dan/atau Vitest untuk frontend bila diperlukan.

Versi paket harus dipatok di lockfile. Hindari mengasumsikan semua versi terbaru saling kompatibel tanpa pengujian.

## 14. Keamanan dan Isolasi Antarkelas

Ini adalah persyaratan kritis, bukan fitur tambahan.

### 14.1 Pemeriksaan akses server-side

Setiap request yang menggunakan `classId`, `assignmentId`, atau `submissionId` harus memeriksa relasi resource dengan pengguna yang login.

- Admin: akses administratif sesuai endpoint admin.
- Guru: harus memiliki keanggotaan guru pada kelas pemilik tugas.
- Murid: harus menjadi anggota kelas pemilik tugas.
- Submission murid: `student_id` harus sama dengan ID pengguna yang login.
- Berkas: otorisasi harus dilakukan lagi setiap kali berkas diunduh.

### 14.2 Mencegah IDOR

IDOR (*Insecure Direct Object Reference*) terjadi ketika pengguna bisa mengakses resource orang lain dengan mengganti ID.

Mitigasi:
1. Jangan menggunakan UUID sebagai pengganti otorisasi. UUID hanya membuat ID sulit ditebak, bukan membuat resource aman.
2. Query detail harus menggabungkan pemeriksaan resource dan izin pengguna.
3. Jangan mengambil submission berdasarkan ID saja lalu mengembalikannya.
4. Uji request dengan akun dari kelas berbeda.
5. Gunakan respons `404` untuk resource yang tidak boleh diketahui keberadaannya bila strategi ini diterapkan secara konsisten.

### 14.3 Session dan cookie

- Cookie menggunakan `HttpOnly`, `Secure` saat HTTPS, dan `SameSite` yang sesuai.
- Gunakan proteksi CSRF untuk request yang mengubah data jika arsitektur cookie memerlukannya.
- Rotasi atau buat ulang session setelah login.
- Session memiliki masa berlaku dan dapat dicabut saat logout.
- Terapkan rate limit pada login.
- Jangan menyimpan token session mentah dalam database atau log.

### 14.4 Upload berkas

- Tentukan allowlist ekstensi dan MIME yang diperbolehkan, misalnya PDF, DOCX, dan format lain yang diputuskan untuk MVP.
- Terapkan batas ukuran awal, misalnya 10 MB per berkas, sebagai konfigurasi yang dapat diubah.
- Jangan percaya MIME dari browser saja; lakukan pemeriksaan tambahan yang sesuai.
- Gunakan nama internal acak untuk penyimpanan.
- Jangan mengeksekusi atau menyajikan berkas unggahan sebagai konten aktif dari origin aplikasi.
- Pastikan file download melewati pemeriksaan otorisasi.
- Hapus berkas yatim saat submission dihapus atau diganti, setelah memastikan tidak lagi direferensikan.

### 14.5 Data dan konfigurasi

- Simpan kredensial database dan secret session di environment variable.
- Sediakan `.env.example` tanpa secret.
- Gunakan parameterized query/ORM.
- Terapkan CORS hanya untuk origin frontend yang diizinkan.
- Jangan mengirim stack trace atau detail internal database ke pengguna.
- Jangan mencatat kata sandi, token, isi jawaban, atau berkas dalam log.

## 15. Kriteria Penerimaan

### Autentikasi dan role

- [ ] Pengguna aktif dapat login dengan kredensial valid.
- [ ] Kredensial tidak valid menghasilkan error yang aman.
- [ ] Pengguna nonaktif tidak dapat login.
- [ ] Pengguna yang belum login tidak dapat mengakses endpoint terlindungi.
- [ ] Murid tidak dapat memanggil endpoint admin atau endpoint penilaian guru.
- [ ] Role tidak dapat diubah dengan memanipulasi request frontend.

### Manajemen kelas

- [ ] Admin dapat membuat kelas.
- [ ] Admin dapat menetapkan guru dan murid.
- [ ] Guru hanya melihat kelas yang ditugaskan kepadanya.
- [ ] Murid hanya melihat kelas yang diikutinya.
- [ ] Akun dengan role yang salah tidak dapat ditambahkan sebagai guru/murid yang sesuai.

### Tugas

- [ ] Guru yang ditugaskan dapat membuat tugas.
- [ ] Guru dari kelas lain tidak dapat mengubah tugas tersebut.
- [ ] Murid dapat melihat tugas kelasnya.
- [ ] Murid dari kelas lain tidak dapat melihat detail tugas.
- [ ] Tenggat divalidasi dan ditampilkan dengan benar.
- [ ] Backend menolak submission setelah tenggat, walaupun UI dimanipulasi.

### Submission dan penilaian

- [ ] Murid dapat mengirim teks, berkas, atau keduanya.
- [ ] Submission kosong ditolak.
- [ ] Murid tidak dapat mengirim submission atas nama murid lain.
- [ ] Murid tidak dapat melihat submission murid lain.
- [ ] Guru hanya dapat melihat submission dari kelas yang diajarnya.
- [ ] Guru yang berhak dapat memberi nilai 0–100 dan komentar.
- [ ] Nilai di luar rentang ditolak.
- [ ] Murid hanya dapat melihat nilai dan komentar miliknya.
- [ ] Berkas tidak dapat diunduh tanpa izin.
- [ ] Revisi submission sebelum tenggat membatalkan nilai lama sesuai aturan bisnis.

### Isolasi kelas

- [ ] Murid A tidak dapat membaca tugas kelas B melalui URL/API.
- [ ] Murid A tidak dapat membaca submission murid B di kelas lain.
- [ ] Guru A tidak dapat membaca atau menilai tugas di kelas yang tidak diajarnya.
- [ ] Mengganti UUID pada request tidak membuka akses.
- [ ] Filter dan pagination tidak membocorkan data kelas lain.
- [ ] Semua pemeriksaan tersebut diuji langsung terhadap API, bukan hanya melalui UI.

## 16. Strategi Pengujian

### Unit test

Uji fungsi dan aturan bisnis secara terisolasi:
- Validasi role dan status akun.
- Validasi tenggat.
- Validasi nilai.
- Validasi submission kosong.
- Validasi ekstensi dan ukuran berkas.
- Logika reset nilai ketika submission direvisi.

### Integration test API

Uji endpoint menggunakan database pengujian:
- Login/logout/session.
- CRUD kelas dan penetapan anggota.
- CRUD tugas dengan role dan kelas berbeda.
- Pembuatan dan pembaruan submission.
- Penilaian tugas.
- Akses unduhan berkas.

### Matriks pengujian isolasi kelas

| Pengguna | Resource | Hasil yang diharapkan |
|---|---|---|
| Murid kelas A | Tugas kelas A | Diizinkan |
| Murid kelas A | Tugas kelas B | Ditolak |
| Murid kelas A | Submission miliknya | Diizinkan |
| Murid kelas A | Submission murid lain | Ditolak |
| Guru kelas A | Submission di kelas A | Diizinkan |
| Guru kelas A | Submission di kelas B tanpa penugasan | Ditolak |
| Admin | Pengelolaan akun dan kelas | Diizinkan |
| Murid | Endpoint pembuatan kelas admin | Ditolak |

### End-to-end test

Uji alur lengkap:
1. Admin membuat akun guru dan murid.
2. Admin membuat dua kelas dan menugaskan guru serta murid.
3. Guru membuat tugas pada kelas A.
4. Murid kelas A mengumpulkan jawaban.
5. Guru memberi nilai dan komentar.
6. Murid melihat hasil penilaian.
7. Murid kelas B mencoba mengakses tugas/submission kelas A dan ditolak.

### Pengujian manual

Periksa:
- Loading, empty state, dan error.
- Validasi form.
- Responsif pada desktop dan layar kecil.
- Batas tenggat.
- Penggantian berkas.
- Perilaku saat session kedaluwarsa.

## 17. Prioritas Implementasi

Urutan berikut mengurangi risiko membangun UI sebelum aturan akses dan model datanya stabil.

1. **Fondasi proyek:** setup monorepo, Bun, Nuxt, Elysia, PostgreSQL, environment, migrasi.
2. **Model data dan autentikasi:** tabel, seed admin, login/logout, session, `/auth/me`.
3. **Otorisasi:** middleware autentikasi, role, dan helper pemeriksaan keanggotaan kelas.
4. **Admin:** CRUD akun, CRUD kelas, penetapan guru dan murid.
5. **Guru:** dashboard, daftar kelas, CRUD tugas.
6. **Murid:** dashboard, kelas, daftar/detail tugas.
7. **Submission:** unggah berkas, jawaban teks, validasi tenggat, unduhan aman.
8. **Penilaian:** daftar submission, nilai, komentar, dan tampilan hasil untuk murid.
9. **Pengujian keamanan:** tes IDOR dan isolasi kelas untuk setiap endpoint terkait.
10. **Polishing dan dokumentasi:** error state, responsive UI, README, akun demo, dan persiapan deployment.

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Otorisasi hanya dilakukan di frontend | Data kelas bocor | Semua akses diverifikasi di backend dan diuji melalui API |
| Scope proyek membesar | MVP tidak selesai | Tunda fitur non-goals |
| Upload berkas tidak aman | Penyalahgunaan storage atau kebocoran | Allowlist, limit ukuran, nama internal acak, otorisasi unduhan |
| Perubahan schema di tengah jalan | Migrasi dan data tidak konsisten | Gunakan migrasi database dan constraint |
| Session/cookie salah konfigurasi | Akun dapat disalahgunakan | Cookie aman, CSRF sesuai arsitektur, rotasi dan expiry session |
| Versi library tidak kompatibel | Setup sulit direproduksi | Pin versi dan simpan lockfile |
| Aturan revisi/penilaian ambigu | Hasil penilaian tidak konsisten | Terapkan aturan revisi yang eksplisit dan diuji |

## 19. Deployment dan Konfigurasi

Deployment belum diputuskan. Pada MVP, aplikasi harus dapat berjalan di lingkungan lokal dengan PostgreSQL.

Variabel konfigurasi minimum yang disarankan:

```env
DATABASE_URL=
SESSION_SECRET=
API_PORT=3001
WEB_ORIGIN=http://localhost:3000
UPLOAD_MAX_BYTES=10485760
UPLOAD_DIR=./uploads
NODE_ENV=development
```

Jangan commit file `.env` berisi secret. Sertakan `.env.example` dengan nilai kosong atau nilai contoh yang tidak sensitif.

Untuk deployment publik, gunakan HTTPS, storage berkas persisten, backup database, konfigurasi cookie yang sesuai, dan secret yang dikelola melalui fasilitas environment platform. Jangan mengandalkan filesystem sementara pada platform hosting untuk menyimpan submission.

## 20. Definisi Selesai (Definition of Done)

Sebuah fitur dianggap selesai jika:
- Berfungsi sesuai user story dan kriteria penerimaan.
- Memiliki validasi input di backend.
- Memeriksa role dan keanggotaan kelas sesuai kebutuhan.
- Memiliki error handling yang konsisten.
- Memiliki pengujian yang relevan, terutama untuk akses tidak sah.
- Tidak membocorkan data sensitif melalui respons atau log.
- Memiliki tampilan loading, empty state, dan error yang layak.
- Perubahan schema disertai migrasi.
- Dokumentasi setup diperbarui bila diperlukan.

## 21. Hal yang Sengaja Belum Diputuskan

1. ORM/query builder final: Drizzle ORM atau Prisma.
2. Library komponen dan styling frontend.
3. Penyedia hosting frontend/backend dan database.
4. Penyedia object storage untuk deployment publik.
5. Daftar final tipe berkas yang diizinkan.
6. Mekanisme distribusi kata sandi awal dan reset kata sandi.
7. Apakah admin perlu melihat laporan agregat submission tanpa mengakses isi jawaban.

Keputusan tersebut tidak menghalangi pembuatan fondasi MVP. Pilih setelah menguji kompatibilitas teknologi dan kebutuhan nyata, bukan hanya karena sebuah library sedang ramai dibicarakan.

---

## Ringkasan MVP

Versi pertama harus memungkinkan admin membuat akun dan kelas, guru membuat tugas, murid mengumpulkan teks/berkas sebelum tenggat, dan guru menilai submission. Setiap tindakan dibatasi oleh role dan keanggotaan kelas yang diverifikasi di backend. Fitur lain ditunda sampai alur utama dan pengujian isolasi kelas terbukti benar.
