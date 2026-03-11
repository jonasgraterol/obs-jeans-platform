# Medusa VPS Deployment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Medusa v2.13.1 backend to DigitalOcean VPS with PostgreSQL + Redis in Docker, Nginx reverse proxy, SSL, and SendGrid email.

**Architecture:** Medusa runs natively via systemd on port 9000. PostgreSQL and Redis run as Docker containers bound to localhost. Nginx reverse-proxies `admin.jeansobs.com` and `api.jeansobs.com` to Medusa with Let's Encrypt SSL.

**Tech Stack:** Medusa v2.13.1, PostgreSQL 16 (Docker), Redis 7 (Docker), Nginx, Certbot, systemd, Ubuntu 24.04

**Spec:** `docs/superpowers/specs/2026-03-10-medusa-vps-deployment-design.md`

**VPS Access:** `ssh root@64.23.190.118` (password: see credentials)

---

## Prerequisites Checklist (Manual — do these before starting)

- [ ] Upsize DigitalOcean droplet to 4GB RAM ($24/month plan)
- [ ] Add DNS A record in Wix: `admin.jeansobs.com` → `64.23.190.118`
- [ ] Add DNS A record in Wix: `api.jeansobs.com` → `64.23.190.118`
- [ ] Verify DNS propagation: `dig admin.jeansobs.com` and `dig api.jeansobs.com` resolve to `64.23.190.118`
- [ ] Create SendGrid account at https://sendgrid.com (free tier)
- [ ] Create SendGrid API key with "Mail Send" permission — save the key
- [ ] Set up SendGrid Sender Authentication for `jeansobs.com` (or verify single sender `ventas@jeansobs.com`)

---

## Chunk 1: Code Changes (Local)

These tasks happen on your local machine before touching the VPS.

### Task 1: Update medusa-config.ts with SendGrid and Redis

**Files:**
- Modify: `obs-jeans-platform/medusa-config.ts`
- Modify: `obs-jeans-platform/.env.template`

- [ ] **Step 1: Update medusa-config.ts**

Replace the entire file content with:

```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM,
            },
          },
        ],
      },
    },
  ],
})
```

- [ ] **Step 2: Update .env.template**

Add to the bottom of `.env.template`:

```env
SENDGRID_API_KEY=
SENDGRID_FROM=ventas@jeansobs.com
```

- [ ] **Step 3: Update local .env with placeholder SendGrid vars**

Add to your local `.env`:

```env
SENDGRID_API_KEY=
SENDGRID_FROM=ventas@jeansobs.com
```

- [ ] **Step 4: Test locally — verify Medusa still starts**

```bash
cd obs-jeans-platform
npm run dev
```

Expected: Medusa starts without errors on http://localhost:9000. SendGrid may warn about missing API key in dev — that's fine.

Press Ctrl+C to stop.

- [ ] **Step 5: Commit and push**

```bash
cd obs-jeans-platform
git add medusa-config.ts .env.template
git commit -m "feat: add SendGrid notification provider and Redis URL to config"
git push origin main
```

---

## Chunk 2: VPS System Setup

All tasks via SSH to `root@64.23.190.118`.

### Task 2: Install Docker

- [ ] **Step 1: SSH into VPS**

```bash
ssh root@64.23.190.118
```

- [ ] **Step 2: Install Docker**

```bash
curl -fsSL https://get.docker.com | sh
```

- [ ] **Step 3: Verify Docker is running**

```bash
docker --version
systemctl status docker --no-pager
```

Expected: Docker version 27.x, service active (running).

### Task 3: Install Nginx and Certbot

- [ ] **Step 1: Install packages**

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx
```

- [ ] **Step 2: Verify Nginx is running**

```bash
nginx -v
systemctl status nginx --no-pager
```

Expected: nginx version, service active (running).

- [ ] **Step 3: Verify from outside**

From your local machine:

```bash
curl -I http://64.23.190.118
```

Expected: HTTP 200 with "Welcome to nginx" (or similar default page).

### Task 4: Create system user and directories

- [ ] **Step 1: Create medusa user**

```bash
useradd --system --no-create-home --shell /bin/false medusa
```

- [ ] **Step 2: Create backup directory**

```bash
mkdir -p /opt/backups
```

- [ ] **Step 3: Verify**

```bash
id medusa
ls -la /opt/backups
```

Expected: uid for medusa user, empty backups directory.

### Task 5: Configure UFW firewall

- [ ] **Step 1: Configure rules**

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

- [ ] **Step 2: Verify**

```bash
ufw status
```

Expected: Shows 22, 80, 443 as ALLOW. Everything else denied.

- [ ] **Step 3: Verify SSH still works**

Open a NEW terminal and test SSH before closing the current session:

```bash
ssh root@64.23.190.118
```

Expected: Connection succeeds. If it doesn't, you've locked yourself out — do NOT close the original session.

---

## Chunk 3: Data Services (Docker)

### Task 6: Create Docker Compose for PostgreSQL + Redis

- [ ] **Step 1: Create directory**

```bash
mkdir -p /opt/obs-jeans-data
```

- [ ] **Step 2: Generate a strong database password**

```bash
openssl rand -hex 32
```

Save this output — this is your `<db-password>`. You'll need it for the `.env` file too.

- [ ] **Step 3: Create docker-compose.yml**

```bash
cat > /opt/obs-jeans-data/docker-compose.yml << 'COMPOSE'
services:
  postgres:
    image: postgres:16
    container_name: obs-postgres
    restart: always
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_USER: medusa
      POSTGRES_PASSWORD: <PASTE-PASSWORD-HERE>
      POSTGRES_DB: obs_jeans_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medusa"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: obs-redis
    restart: always
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 256M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
COMPOSE
```

**IMPORTANT:** Edit the file and replace `<PASTE-PASSWORD-HERE>` with the password from Step 2.

```bash
nano /opt/obs-jeans-data/docker-compose.yml
```

- [ ] **Step 4: Start containers**

```bash
cd /opt/obs-jeans-data
docker compose up -d
```

- [ ] **Step 5: Verify both containers are healthy**

```bash
docker ps
```

Expected: `obs-postgres` and `obs-redis` both with status `Up ... (healthy)`. May take 10-20 seconds for health checks.

- [ ] **Step 6: Test PostgreSQL connection**

```bash
docker exec obs-postgres psql -U medusa -d obs_jeans_platform -c "SELECT 1;"
```

Expected: Returns `1`.

- [ ] **Step 7: Test Redis connection**

```bash
docker exec obs-redis redis-cli ping
```

Expected: `PONG`.

---

## Chunk 4: Deploy Medusa Application

### Task 7: Clone and configure Medusa

- [ ] **Step 1: Clone the repository**

```bash
cd /opt
git clone https://github.com/jonasgraterol/obs-jeans-platform.git obs-jeans-platform
```

- [ ] **Step 2: Install dependencies**

```bash
cd /opt/obs-jeans-platform
npm ci --omit=dev
```

Expected: Clean install from lockfile, no errors.

- [ ] **Step 3: Generate secrets**

```bash
echo "JWT_SECRET: $(openssl rand -hex 32)"
echo "COOKIE_SECRET: $(openssl rand -hex 32)"
```

Save both values.

- [ ] **Step 4: Create production .env file**

```bash
cat > /opt/obs-jeans-platform/.env << 'ENVFILE'
NODE_ENV=production
DATABASE_URL=postgres://medusa:<db-password>@localhost:5432/obs_jeans_platform
REDIS_URL=redis://localhost:6379
STORE_CORS=https://jeansobs.com,https://www.jeansobs.com
ADMIN_CORS=https://admin.jeansobs.com
AUTH_CORS=https://admin.jeansobs.com,https://jeansobs.com,https://www.jeansobs.com
JWT_SECRET=<paste-jwt-secret>
COOKIE_SECRET=<paste-cookie-secret>
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
SENDGRID_API_KEY=<paste-sendgrid-api-key>
SENDGRID_FROM=ventas@jeansobs.com
ENVFILE
```

**IMPORTANT:** Edit and replace all `<placeholder>` values:

```bash
nano /opt/obs-jeans-platform/.env
```

Replace:
- `<db-password>` — same password from Task 6 Step 2
- `<paste-jwt-secret>` — from Step 3 above
- `<paste-cookie-secret>` — from Step 3 above
- `<paste-sendgrid-api-key>` — from SendGrid dashboard

- [ ] **Step 5: Verify .env has no placeholders left**

```bash
grep '<' /opt/obs-jeans-platform/.env
```

Expected: No output (no angle brackets remaining).

### Task 8: Build Medusa and run migrations

- [ ] **Step 1: Build**

```bash
cd /opt/obs-jeans-platform
npm run build
```

Expected: Build completes without errors. Takes 1-3 minutes.

- [ ] **Step 2: Run database migrations**

```bash
npx medusa db:migrate
```

Expected: Migrations applied successfully. Creates all Medusa tables.

- [ ] **Step 3: Verify tables exist**

```bash
docker exec obs-postgres psql -U medusa -d obs_jeans_platform -c "\dt" | head -20
```

Expected: List of Medusa tables (product, order, customer, etc.).

### Task 9: Create systemd service

- [ ] **Step 1: Create service file**

```bash
cat > /etc/systemd/system/medusa.service << 'SERVICE'
[Unit]
Description=Medusa E-Commerce Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=medusa
Group=medusa
WorkingDirectory=/opt/obs-jeans-platform
ExecStart=/opt/obs-jeans-platform/node_modules/.bin/medusa start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=1536
EnvironmentFile=/opt/obs-jeans-platform/.env
StandardOutput=journal
StandardError=journal
SyslogIdentifier=medusa

[Install]
WantedBy=multi-user.target
SERVICE
```

- [ ] **Step 2: Set ownership**

```bash
chown -R medusa:medusa /opt/obs-jeans-platform
```

- [ ] **Step 3: Enable and start**

```bash
systemctl daemon-reload
systemctl enable medusa
systemctl start medusa
```

- [ ] **Step 4: Verify Medusa is running**

```bash
systemctl status medusa --no-pager
```

Expected: Active (running).

- [ ] **Step 5: Check logs for errors**

```bash
journalctl -u medusa --no-pager -n 30
```

Expected: Medusa startup logs, no errors. Look for "Server is ready" or similar.

- [ ] **Step 6: Test local access**

```bash
curl -s http://localhost:9000/health | head -5
```

Expected: HTTP 200 response (JSON health check).

---

## Chunk 5: Nginx + SSL

### Task 10: Configure Nginx reverse proxy

- [ ] **Step 1: Create Nginx config**

```bash
cat > /etc/nginx/sites-available/obs-jeans << 'NGINX'
# Admin dashboard
server {
    listen 80;
    server_name admin.jeansobs.com;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }
}

# Store API
server {
    listen 80;
    server_name api.jeansobs.com;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }
}
NGINX
```

- [ ] **Step 2: Enable site and remove default**

```bash
ln -s /etc/nginx/sites-available/obs-jeans /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

- [ ] **Step 3: Test config**

```bash
nginx -t
```

Expected: `syntax is ok` and `test is successful`.

- [ ] **Step 4: Restart Nginx**

```bash
systemctl restart nginx
```

- [ ] **Step 5: Test HTTP access (before SSL)**

From your local machine:

```bash
curl -I http://admin.jeansobs.com
curl -I http://api.jeansobs.com
```

Expected: HTTP 200 from both (proxied to Medusa). If DNS hasn't propagated yet, you'll get an error — wait and retry.

### Task 11: Install SSL certificates

- [ ] **Step 1: Run Certbot**

```bash
certbot --nginx -d admin.jeansobs.com -d api.jeansobs.com --non-interactive --agree-tos -m jonas@graterol.dev
```

Expected: Certificate obtained and installed. Nginx config auto-updated with SSL directives.

- [ ] **Step 2: Verify SSL auto-renewal timer**

```bash
systemctl list-timers | grep certbot
```

Expected: certbot timer listed.

- [ ] **Step 3: Test HTTPS access**

From your local machine:

```bash
curl -I https://admin.jeansobs.com
curl -I https://api.jeansobs.com
```

Expected: HTTP 200 with valid SSL from both.

---

## Chunk 6: Post-Deploy Setup

### Task 12: Create admin user

- [ ] **Step 1: Create the admin user**

```bash
cd /opt/obs-jeans-platform
npx medusa user -e admin@jeansobs.com -p <choose-a-strong-password>
```

Expected: User created successfully.

- [ ] **Step 2: Test admin login**

Open `https://admin.jeansobs.com` in browser. Log in with the credentials from Step 1.

Expected: Medusa admin dashboard loads.

### Task 13: Seed demo data (optional)

**Skip this task if going straight to production data.**

- [ ] **Step 1: Run seed**

```bash
cd /opt/obs-jeans-platform
npx medusa exec ./src/scripts/seed.ts
```

Expected: Demo products, regions, shipping options created.

- [ ] **Step 2: Verify in admin**

Go to `https://admin.jeansobs.com` → Products. Should see demo products.

**When ready to wipe demo data and go to production:**

- [ ] **Step 3: Wipe database**

```bash
systemctl stop medusa
docker exec obs-postgres psql -U medusa -c "DROP DATABASE obs_jeans_platform;"
docker exec obs-postgres psql -U medusa -c "CREATE DATABASE obs_jeans_platform;"
cd /opt/obs-jeans-platform
npx medusa db:migrate
systemctl start medusa
```

Then re-create admin user (Task 12) and load real product data.

### Task 14: Set up daily backups

- [ ] **Step 1: Create cron job**

```bash
cat > /etc/cron.d/obs-jeans-backup << 'CRON'
# Daily PostgreSQL backup at 3 AM, keep 7 days
0 3 * * * root docker exec obs-postgres pg_dump -U medusa obs_jeans_platform 2>>/var/log/obs-backup-errors.log | gzip > /opt/backups/obs-jeans-$(date +\%Y\%m\%d).sql.gz && find /opt/backups/ -name "obs-jeans-*.sql.gz" -mtime +7 -delete
CRON
```

- [ ] **Step 2: Test backup manually**

```bash
docker exec obs-postgres pg_dump -U medusa obs_jeans_platform | gzip > /opt/backups/obs-jeans-test.sql.gz
ls -lh /opt/backups/obs-jeans-test.sql.gz
```

Expected: Compressed backup file created (size depends on data).

- [ ] **Step 3: Clean up test backup**

```bash
rm /opt/backups/obs-jeans-test.sql.gz
```

---

## Chunk 7: Verification

### Task 15: Run full verification checklist

- [ ] **Step 1: API health check**

```bash
curl -s https://api.jeansobs.com/health
```

Expected: 200 OK response.

- [ ] **Step 2: Admin UI loads**

Open `https://admin.jeansobs.com` in browser.

Expected: Medusa admin login page with valid SSL.

- [ ] **Step 3: Admin login works**

Log in with credentials from Task 12.

Expected: Dashboard loads.

- [ ] **Step 4: SSL certificates valid**

```bash
echo | openssl s_client -connect admin.jeansobs.com:443 -servername admin.jeansobs.com 2>/dev/null | openssl x509 -noout -dates
echo | openssl s_client -connect api.jeansobs.com:443 -servername api.jeansobs.com 2>/dev/null | openssl x509 -noout -dates
```

Expected: Valid dates shown, not expired.

- [ ] **Step 5: OpenClaw still running**

```bash
systemctl status openclaw-gateway --no-pager
```

Expected: Active (running). Note: it was crash-looping before deployment — if still failing, that's a pre-existing issue, not caused by this deployment.

- [ ] **Step 6: Firewall blocks direct ports**

From your local machine:

```bash
curl --connect-timeout 3 http://64.23.190.118:9000 2>&1 || echo "BLOCKED (good)"
curl --connect-timeout 3 http://64.23.190.118:5432 2>&1 || echo "BLOCKED (good)"
curl --connect-timeout 3 http://64.23.190.118:6379 2>&1 || echo "BLOCKED (good)"
```

Expected: All three timeout/fail with "BLOCKED (good)".

- [ ] **Step 7: Redis connectivity**

On VPS:

```bash
docker exec obs-redis redis-cli ping
```

Expected: `PONG`.

- [ ] **Step 8: Test email (if SendGrid configured)**

In admin UI, invite a new team member with your email. Or trigger a password reset.

Expected: Email received from `ventas@jeansobs.com`.

- [ ] **Step 9: Check memory usage**

```bash
free -h
```

Expected: Reasonable usage with available memory. Total ~4GB, used should be under 3GB.

---

## Quick Reference: Common Operations

**View Medusa logs:**
```bash
journalctl -u medusa -f
```

**Restart Medusa:**
```bash
systemctl restart medusa
```

**Redeploy after code changes:**
```bash
cd /opt/obs-jeans-platform
git pull origin main
npm install
npm run build
cp -r .medusa/server/public public    # admin build goes to wrong dir
npx medusa db:migrate                 # only if schema changes
chown -R medusa:medusa /opt/obs-jeans-platform
systemctl restart medusa
```

**Wipe database for fresh start:**
```bash
systemctl stop medusa
docker exec obs-postgres psql -U medusa -c "DROP DATABASE obs_jeans_platform;"
docker exec obs-postgres psql -U medusa -c "CREATE DATABASE obs_jeans_platform;"
cd /opt/obs-jeans-platform && npx medusa db:migrate
systemctl start medusa
# Then re-create admin user
```

**Restore from backup:**
```bash
systemctl stop medusa
docker exec obs-postgres psql -U medusa -c "DROP DATABASE obs_jeans_platform;"
docker exec obs-postgres psql -U medusa -c "CREATE DATABASE obs_jeans_platform;"
gunzip -c /opt/backups/obs-jeans-YYYYMMDD.sql.gz | docker exec -i obs-postgres psql -U medusa obs_jeans_platform
systemctl start medusa
```
