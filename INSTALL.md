# Install (Self-host)

## Requirements
- Docker + Docker Compose (recommended)
- OR Node 18+ (manual)

## Docker (recommended)
1. Set your `LICENSE_KEY` in `docker-compose.yml` or an `.env` file.
2. Run:

```bash
docker compose up -d --build
```

Open:
- http://localhost:3000
- Health: http://localhost:3000/health

## Manual

```bash
npm install
export LICENSE_KEY="POH-ABCD-1234-Z9Y8"
npm start
```

## Configuration
- `LICENSE_KEY` (required)
- `PORT` (optional)
