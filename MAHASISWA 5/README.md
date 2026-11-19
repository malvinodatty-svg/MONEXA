# MONEXA / CloudWallet - Container & Deployment (M5)

Stack lengkap: React (Vite) + Node.js/Express + MySQL + Object Storage (RustFS) di belakang Nginx reverse proxy.

## Menjalankan

Prasyarat: Docker Desktop (engine berjalan) dan Git.

```bash
# Linux/Mac                         # Windows PowerShell
./scripts/setup-env.sh              .\scripts\setup-env.ps1      # buat .env + secret acak
docker compose up -d --build
docker compose ps                   # tunggu semua "healthy"
./scripts/smoke-test.sh             # uji register -> login -> saldo (Linux/Mac/Git Bash)
```

Atau manual: `cp .env.example .env` lalu ganti semua nilai `ganti_...`.

- Aplikasi : http://localhost:8080 (sesuai `APP_PORT`)
- Console object storage : http://localhost:9001 (hanya dari mesin host; buat bucket `receipts`)

## Arsitektur

```
Browser -> cloudwallet-proxy (Nginx :80)
              |-- /      -> cloudwallet-frontend (Nginx + build React)
              |-- /api/  -> cloudwallet-backend  (Express :8000)
                                 |-- cloudwallet-database       (MySQL 8.4)
                                 |-- cloudwallet-object-storage (RustFS, S3 API :9000)
```

| Container | Image / build | Port ke host |
|---|---|---|
| cloudwallet-proxy | nginx:1.27-alpine | `APP_PORT` (8080) |
| cloudwallet-frontend | build `./frontend` (multi-stage node -> nginx) | - |
| cloudwallet-backend | build `./backend` (node:20 slim, user non-root) | - |
| cloudwallet-database | mysql:8.4 | - |
| cloudwallet-object-storage | rustfs/rustfs | 127.0.0.1:9001 (console) |

**Container networking** - dua network terpisah:
- `cloudwallet-edge`: proxy, frontend, backend
- `cloudwallet-backend`: backend, database, object storage

Database dan object storage tidak bisa dijangkau dari proxy/frontend dan tidak membuka port ke host.

**Urutan start**: database healthy (schema selesai dimuat) -> backend -> proxy.

**Environment**: semua secret ada di `.env` (tidak di-commit). Frontend memakai base URL relatif `/api`, jadi tidak ada alamat yang di-hardcode.

## Integrasi tim

| Anggota | Yang perlu diperhatikan |
|---|---|
| M1 frontend | Kode ada di `frontend/`. API dipanggil lewat `/api/...` (diatur via build arg `VITE_API_BASE_URL`). |
| M2 backend | Kode ada di `backend/`. Config dibaca dari env: `DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET`. Untuk receipt tersedia `S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET`. |
| M3 database | Taruh schema/seed di `db/init/` (`01_schema.sql`, `02_seed.sql`, ...). |
| M6 storage/backup | Volume: `dbdata` (MySQL), `objectdata` (receipt). Backup DB: `docker exec cloudwallet-database sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction monexa_db' > backup.sql` |
| M7/M8 monitoring | Tambah service Prometheus/Grafana ke `docker-compose.yml` pada network `cloudwallet-backend`/`cloudwallet-edge`. |

## Perintah berguna

```bash
docker compose logs -f cloudwallet-backend
docker compose restart cloudwallet-backend
docker stop cloudwallet-backend        # simulasi kegagalan (proxy tetap hidup, /api/ -> 502)
docker start cloudwallet-backend
docker compose down                    # hentikan (data tetap)
docker compose down -v                 # hentikan + HAPUS semua data
```

## Catatan
- Database memakai **MySQL** karena schema M3 dan backend ditulis untuk MySQL (dokumen mini-project mengizinkan MySQL sebagai alternatif PostgreSQL).
- Backend belum memakai object storage; variabel `S3_*` sudah disiapkan untuk fitur digital receipt.
- Pipeline CI (`.github/workflows/ci.yml`) membangun stack dan menjalankan smoke test pada tiap push.
