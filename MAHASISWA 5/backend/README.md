# MONEXA CloudWallet Backend

## Setup
```bash
npm install
mysql -u root -p < database/schema.sql   # buat database + tabel
# isi .env, gunakan DB_NAME=monexa_db
npm run dev
```

## Endpoint
Semua endpoint selain register/login butuh header `Authorization: Bearer <token>`.

Endpoint tersedia dengan prefix `/api` dan tanpa prefix `/api`.

| Method | Endpoint | Body / Query |
|---|---|---|
| POST | /auth/register | `name, email, role, password, confirmPassword` (`confirmPassword` diabaikan backend) |
| POST | /auth/login | `email, password` |
| GET  | /wallet/balance | - |
| GET  | /transactions | `?type=TRANSFER&limit=3` |
| GET  | /transactions/:id | `:id` boleh UUID internal atau `TRX-...` |
| POST | /wallet/transfer | `recipient, amount, note?` |
| POST | /wallet/topup | `amount, method` |
| POST | /wallet/payment | `merchantCode, amount` |

## Database
Schema saat ini mengikuti Joshua: MySQL `monexa_db` dengan UUID `CHAR(36)`, `wallet_number` format `MX-xxxx-xxxx`, transaksi `reference_id` format `TRX-YYYYMMDD-XXXX`, dan tabel `ledger_entries` untuk audit mutasi saldo.

Catatan integrasi: dokumen Cloud Architecture Minggu 2 menyebut PostgreSQL, jadi M4/M5 perlu menetapkan engine final sebelum container dibuat. Backend ini masih MySQL karena mengikuti schema database Joshua.

`receiptUrl` untuk detail transaksi dibaca dari `transactions.metadata.receiptUrl`. Kalau query receipt sering dipakai, opsi yang lebih rapi adalah menambah kolom `receipt_url`.
