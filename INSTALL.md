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

## License file hot reload (optional)
- You can add `licenses.json` at the project root to allow-list license keys.
- Supported formats:
  - `[
      "POH-ABCD-1234-Z9Y8"
    ]`
  - `{ "licenses": ["POH-ABCD-1234-Z9Y8"] }`
- The server hot-reloads `licenses.json` automatically (mtime/cache + periodic reload + file watcher), so no restart is required after edits.
