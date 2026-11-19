File `.sql` di folder ini dijalankan otomatis (berurutan menurut nama) oleh MySQL
HANYA saat volume database pertama kali dibuat.

- `01_schema.sql` : schema dari M3 (users, wallets, transactions, ledger_entries)

Menjalankan ulang dari nol: `docker compose down -v && docker compose up -d --build`
(perintah ini MENGHAPUS semua data).
