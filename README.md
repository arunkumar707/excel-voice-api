# 🗄️ Voice Excel Assistant — Backend (NestJS)

A **NestJS 10** REST API that provides authentication, workbook management, and data persistence for the Voice Excel Assistant frontend. All routes are versioned under `/api/v1`.

---

## ✨ Features

- **JWT Authentication** — register, login, `me` endpoint
- **Role-based access** — `user` and `super_admin` roles
- **Excel Workbook CRUD** — create, list, get, delete workbooks per user
- **Grid persistence** — save and load spreadsheet grid data to MySQL
- **Row snapshots** — save individual row data with column mapping
- **Excel download** — generate and stream `.xlsx` files
- **Auto super-admin seeding** — creates admin account on first start if configured

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript |
| Database | MySQL (via TypeORM) |
| Auth | Passport.js + JWT (`@nestjs/jwt`) |
| Password hashing | bcrypt |
| Excel generation | ExcelJS |
| Config | `@nestjs/config` (env-based) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8+ running locally or remotely

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` in this folder (`server/`)
```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=excelcusor
DB_SYNCHRONIZE=true        # set to false in production — use migrations

# Server
PORT=3005

# CORS — comma-separated production frontend origins
# CORS_ORIGINS=https://your-frontend.vercel.app

# JWT — use a long random string in production
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRES_IN=7d

# Super admin (optional) — created on startup if not exists
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=adminpassword
```

### 3. Run the development server
```bash
npm run start:dev
```

API available at [http://localhost:3005/api/v1](http://localhost:3005/api/v1)

---

## 📁 Project Structure

```
src/
  main.ts                     # Bootstrap — CORS, global prefix /api/v1
  app.module.ts               # Root module
  nest-listen-port.ts         # Default port constant (3005)

  auth/
    auth.controller.ts        # POST /auth/register, /auth/login, GET /auth/me
    auth.service.ts           # Business logic — register, login, JWT issue
    auth.module.ts            # JWT + Passport setup
    jwt.strategy.ts           # JWT validation strategy
    jwt-auth.guard.ts         # Route guard
    current-user.decorator.ts # @CurrentUser() decorator
    super-admin-seed.service.ts # Auto-creates super admin on startup

  excel-workbooks/
    excel-workbooks.controller.ts  # Workbook CRUD + grid + download endpoints
    excel-workbooks.service.ts     # Business logic + ExcelJS generation
    excel-workbooks.module.ts

  database/
    database.module.ts        # TypeORM MySQL connection (env-based)

  entities/
    user.entity.ts            # User table
    excel-workbook.entity.ts  # Workbook table
    farmer-row.entity.ts      # Row snapshot table
```

---

## 🌐 API Endpoints

All routes prefixed with `/api/v1`

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Create account |
| `POST` | `/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/auth/me` | ✅ | Current user info |

### Excel Workbooks
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/excel-workbooks` | ✅ | List workbooks (supports `?q=search`) |
| `POST` | `/excel-workbooks` | ✅ | Create workbook |
| `GET` | `/excel-workbooks/:id` | ✅ | Get workbook metadata |
| `DELETE` | `/excel-workbooks/:id` | ✅ | Delete workbook |
| `GET` | `/excel-workbooks/:id/grid` | ✅ | Load grid data |
| `PUT` | `/excel-workbooks/:id/grid` | ✅ | Save full grid |
| `POST` | `/excel-workbooks/:id/rows` | ✅ | Save a single row snapshot |
| `GET` | `/excel-workbooks/:id/download` | ✅ | Download as `.xlsx` |

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | ✅ | `127.0.0.1` | MySQL host |
| `DB_PORT` | ✅ | `3306` | MySQL port |
| `DB_USER` | ✅ | `root` | MySQL user |
| `DB_PASSWORD` | ✅ | — | MySQL password |
| `DB_NAME` | ✅ | `excelcusor` | Database name |
| `DB_SYNCHRONIZE` | — | `false` | Set `true` for dev auto-migration |
| `PORT` | — | `3005` | HTTP listen port |
| `JWT_SECRET` | ✅ | — | **Required** — throws on startup if missing |
| `JWT_EXPIRES_IN` | — | `7d` | JWT expiry |
| `CORS_ORIGINS` | — | — | Comma-separated allowed production origins |
| `SUPER_ADMIN_USERNAME` | — | — | Auto-created admin username |
| `SUPER_ADMIN_PASSWORD` | — | — | Auto-created admin password |

---

## 📦 Build for Production

```bash
npm run build
npm run start:prod
```

> ⚠️ Set `DB_SYNCHRONIZE=false` in production and run TypeORM migrations manually.

---

## 🔒 Security Notes

- JWT secret **must** be set — the server throws on startup if missing
- CORS is locked to `localhost` in dev; set `CORS_ORIGINS` for production
- Passwords are hashed with bcrypt (10 rounds)
- All workbook routes are scoped to the authenticated user (no cross-user data access)

---

## 👤 Author

**Arun Kumar A N**
