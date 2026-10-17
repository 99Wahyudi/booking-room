# Monorepo for booking-room (frontend + backend)

This is a monorepo containing the frontend (React + Vite) and backend (Go REST API) for the booking-room application.

## Structure

```
booking-room/
├── frontend/      # React + Vite frontend application
├── backend/       # Go REST API backend application
├── package.json   # Root scripts to run FE + BE together
├── .gitignore     # Git ignore rules (merged)
└── README.md      # This file
```

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Go](https://go.dev/) (check `backend/go.mod` for version requirements)

## Setup

### 1. Install frontend dependencies
```bash
cd frontend
npm install
```

### 2. Setup environment variables

#### Frontend
```bash
cp .env.example .env  # or copy manually
```
Edit `frontend/.env` based on your local configuration.

#### Backend
```bash
cp .env.example .env  # or copy manually
```
Edit `backend/.env` based on your local configuration.

## Development

### Option 1: Run both together (recommended)
Run both frontend and backend in a single terminal from the root directory:

```bash
npm install  # install concurrently
npm run dev
```

This will start:
- Frontend: Vite dev server (usually http://localhost:5173)
- Backend: Go API server (based on config in backend/.env/main.go)

### Option 2: Run separately
If you prefer separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
go run main.go
# or with air for hot reload
air
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Available Scripts (Root)

| Script | Description |
|---|---|
| `npm run dev` | Run both FE and BE together with concurrently |
| `npm run dev:fe` | Run frontend dev server only |
| `npm run dev:be` | Run backend with `go run main.go` |
| `npm run dev:be:air` | Run backend with `air` (hot reload) |
| `npm run build` | Build frontend for production |
| `npm run build:fe` | Build frontend for production |

## Build

### Frontend
```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`.

### Backend
```bash
cd backend
go build .
```

## Architecture & Deployment

**Monorepo for code, deployment separate.**

This monorepo is structured for unified development while keeping deployment flexible:

- **Frontend**: Static build (Vite) - best deployed on platforms like Vercel or Netlify
- **Backend**: Go REST API server - best deployed on platforms like Railway, Render, or Fly.io

This approach allows independent scaling, rollbacks, and deployments of frontend and backend while maintaining a single source of truth in git.

## Notes

- `.env` files are git-ignored and must be created locally from `.env.example`
- The original separate repositories' histories are not preserved in this monorepo (as requested)
- `node_modules`, `dist`, `tmp`, build artifacts are git-ignored