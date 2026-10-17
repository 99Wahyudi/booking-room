# Booking Room BE

Backend boilerplate untuk aplikasi booking ruangan, dibangun dengan Go (Fiber + sqlx + MySQL), arsitektur sama dengan be-proper-quizz-app.

## Struktur

```
booking-room-be/
├── main.go                    # Entry point
├── cmd/                       # CLI commands (cobra)
│   ├── execute.go             # Definisi command
│   └── cmd.go                 # Implementasi command (serve, migrate, seed)
├── config/                    # Konfigurasi (app, database)
├── pkg/                       # Paket bersama
│   ├── database/              # Koneksi MySQL (sqlx)
│   ├── jwt/                   # Helper JWT
│   ├── logger/                # Logger (logrus)
│   ├── response/              # Standar response JSON
│   └── server/                # Bootstrap Fiber server
├── app/
│   ├── model/                 # Struct model (db + json tag)
│   ├── repository/            # Data access (interface + impl)
│   └── http/
│       ├── controller/        # Handler HTTP
│       └── middleware/        # JWT, CORS, logger, role
├── route/api/                 # Registrasi route
└── database/migration/        # File migrasi SQL (golang-migrate)
```

## Menjalankan

```bash
# Salin environment
cp .env.example .env

# Jalankan server
go run . serve

# Hot reload (butuh air)
air
```

## Database

```bash
go run . migrate:up              # jalankan semua migrasi
go run . migrate:down            # rollback 1 migrasi
go run . migrate:fresh           # drop & recreate database
go run . make:migration create_rooms_table   # buat migrasi baru
```

## CLI

```bash
go run . about
go run . seed
```

## Authentikasi (Auth)

Frontend React sudah-disambungkan ke backend (`VITE_API_BASE_URL=http://localhost:8080/api`):

| Endpoint   | Method | Deskripsi                                   |
|------------|--------|---------------------------------------------|
| `/register`| POST   | Daftar user customer (bcrypt hash)          |
| `/login`   | POST   | Login -> return JWT (7 hari) + user         |
| `/auth/me` | GET    | (JWT) return user saat ini                  |
| `/auth/logout` | POST | (JWT) logout                             |

- JWT dikirim di header `Authorization: Bearer <token>`
- Customer role: `customer`, admin role: `admin`

### User Admin (demo)

Untuk teste login admin (`/admin/login`), seed user admin:

```bash
mysql -h localhost -P 3306 -u root booking_room < database/seed/001_admin_user.sql
```

- **Email:** `admin@hotel.com`
- **Password:** `admin123`

File seed idempotent (INSERT ... ON DUPLICATE KEY UPDATE) — bisa dijalankan kembali
safer. Hapus/hange kata sandi via UI setelah masuk untuk production.

## Menambah modul baru (contoh: Room)

1. Buat model di `app/model/room.go`
2. Buat repository di `app/repository/room_repository.go`
3. Buat controller di `app/http/controller/room_controller.go`
4. Daftarkan route di `route/api/` lalu panggil di `pkg/server/server.go`
