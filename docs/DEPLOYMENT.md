# Deployment, Environment & Operations Runbook

## 1. Environment Variables (`.env.example`)

```bash
# Database
DATABASE_URL="file:./dev.db" # Local SQLite for development; or postgresql://user:pass@host:5432/pizzahouse for production

# Application Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Security & Sessions
SESSION_SECRET="your-super-secret-random-32-byte-hex-string"
ADMIN_PIN="1024" # Default local operational override PIN

# Storage
UPLOAD_STORAGE_PATH="./public/uploads/receipts"
```

---

## 2. Deployment Strategies

### Option A: Modern Node.js / VPS / Docker
1. Build the production application:
   ```bash
   npm run build
   ```
2. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Seed baseline restaurant and menu data:
   ```bash
   npx prisma db seed
   ```
4. Start Next.js standalone server:
   ```bash
   npm run start
   ```

### Option B: Cloud PaaS (Vercel / Railway / Render)
- Connect repository.
- Provide PostgreSQL connection string in `DATABASE_URL`.
- Build command: `prisma generate && next build`.

---

## 3. Backup & Disaster Recovery

- **SQLite Dev Backups**: Automated daily copies of `dev.db` to timestamped archive.
- **PostgreSQL Production Backups**: Daily `pg_dump` snapshots with 30-day retention.
- **Receipts Storage**: Periodic rsync or S3 sync of uploaded receipt images.
