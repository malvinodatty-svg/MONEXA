# MONEXA CloudWallet Backend

## Setup
```bash
npm install
mysql -u root -p < database/schema.sql   # buat database + tabel
# isi .env (lihat .env.example)
npm run dev
```

## Endpoint
Semua endpoint selain register/login butuh header `Authorization: Bearer <token>`.

| Method | Endpoint | Body / Query |
|---|---|---|
| POST | /api/auth/register | `name, email, password` (min 8 karakter) |
| POST | /api/auth/login | `email, password` |
| GET  | /api/wallet/balance | - |
| POST | /api/transactions/topup | `amount, description?` |
| POST | /api/transactions/transfer | `to_email, amount, description?` |
| POST | /api/transactions/payment | `merchant, amount` |
| GET  | /api/transactions/history | `?page=1&limit=10&type=TOPUP` |
| GET  | /api/transactions/:id | - |
