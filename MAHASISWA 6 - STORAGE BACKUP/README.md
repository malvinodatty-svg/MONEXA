# MAHASISWA 6 - STORAGE BACKUP

## 1. Deskripsi
Implementasi Object Storage, Backup, Restore, dan Reliability untuk aplikasi MONEXA CloudWallet.

## 2. Teknologi
- RustFS sebagai object storage.
- MySQL/MariaDB sebagai database.
- Node.js dan Express.js sebagai backend.
- AWS SDK for JavaScript (S3 Client) untuk komunikasi dengan RustFS.
- Docker Compose untuk menjalankan RustFS.

## 3. Struktur Folder
```text
MAHASISWA 6 - STORAGE BACKUP/
+-- backend/
¦   +-- src/
¦       +-- app.js
¦       +-- backupService.js
¦       +-- storageService.js
¦       +-- routes/
¦           +-- backupRoutes.js
+-- docker-compose.yml
+-- .env.example
+-- .gitignore
+-- README.md
## 4. Konfigurasi
1. Salin `.env.example` menjadi `.env` pada folder backend aplikasi.
2. Isi semua variabel dengan konfigurasi sendiri.
3. Jangan unggah `.env` ke GitHub.
4. Pastikan konfigurasi database dan RustFS sesuai.

## 5. Menjalankan RustFS
Jalankan dari folder yang berisi docker-compose.yml:

docker compose up -d

RustFS menggunakan:
- Port 9000 untuk S3 API.
- Port 9001 untuk dashboard.

Buat bucket bernama `cloudwallet-backups` melalui dashboard RustFS.

## 6. Dependensi Backend
Pastikan AWS SDK sudah terpasang:

npm install @aws-sdk/client-s3

## 7. Endpoint Backup
POST /api/backup

Alamat lokal:
http://localhost:8000/api/backup

Endpoint menggunakan header:
x-backup-token

Nilainya harus sama dengan BACKUP_API_TOKEN pada konfigurasi backend.

## 8. Proses Backup
1. Backend menerima permintaan backup.
2. Backend membuat dump database.
3. File hasil dump dikirim ke bucket RustFS.
4. Backup disimpan sebagai objek di object storage.

## 9. Restore dan Pengujian
Restore dilakukan dengan mengambil file backup dari object storage dan mengimpornya ke database tujuan.

Lakukan pengujian menggunakan database pengujian, bukan database produksi.

## 10. Keamanan
- Jangan mengunggah .env.
- Jangan mengunggah password, access key, secret key, atau token asli.
- Jangan mengunggah file backup database yang berisi data pengguna.
- Gunakan kredensial berbeda untuk pengujian dan produksi.

## 11. Catatan
Folder ini merupakan dokumentasi dan salinan komponen implementasi M6. Integrasi akhir harus disesuaikan dengan struktur backend utama repository MONEXA.
