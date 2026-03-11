# Medusa Backend VPS Deployment Design

**Date**: 2026-03-10
**Status**: Approved
**Author**: Jonas Graterol

## Overview

Deploy the OBS Jeans Medusa v2.13.1 backend to a DigitalOcean VPS (64.23.190.118) running Ubuntu 24.04. PostgreSQL and Redis run as Docker containers. The Medusa application runs natively via systemd. Nginx handles reverse proxy and SSL termination.

The Next.js storefront is deployed separately on Vercel (out of scope for this document).

## Architecture

```
                    Internet
                       |
            +----------+----------+
            |       Nginx         |
            |  (reverse proxy     |
            |   + SSL/TLS)        |
            +----+----------+----+
                 |          |
   admin.jeansobs.com  api.jeansobs.com
                 |          |
                 +----+-----+
                      |
                 localhost:9000
                      |
               +------+------+
               |   Medusa    |
               |  (systemd)  |
               +------+------+
                      |
          +-----------+-----------+
          |                       |
   Docker: PostgreSQL       Docker: Redis
   localhost:5432           localhost:6379
```

- Single Medusa process serves both admin UI and store API
- Nginx routes both subdomains to localhost:9000
- CORS config distinguishes admin vs store origins

## Infrastructure

### VPS Specifications

| Spec | Value |
|------|-------|
| Provider | DigitalOcean |
| IP | 64.23.190.118 |
| OS | Ubuntu 24.04.3 LTS |
| RAM | 4GB (upgrade from 2GB required) |
| Disk | 67GB SSD |
| Cost | $24/month |
| Node.js | v22.22.0 (pre-installed) |

### Domains

| Subdomain | Purpose | Points to |
|-----------|---------|-----------|
| admin.jeansobs.com | Medusa admin dashboard | 64.23.190.118 |
| api.jeansobs.com | Store API for storefront | 64.23.190.118 |

DNS managed in Wix. A records required before deployment.

### Components

| Component | Version | Runs as | Port | Why |
|-----------|---------|---------|------|-----|
| PostgreSQL | 16 | Docker container | 5432 | Easy backups, upgrades, isolated from OS |
| Redis | 7-alpine | Docker container | 6379 | Lightweight, isolated |
| Medusa | 2.13.1 | systemd service | 9000 | Native Node.js, simpler debugging, journalctl logs |
| Nginx | latest | apt package | 80, 443 | Reverse proxy + SSL termination |
| Certbot | latest | apt package | - | Auto-renewing Let's Encrypt certificates |
| OpenClaw | existing | systemd service | 18789-18792 | AI agent (already deployed) |

### Email Service

| Service | Details |
|---------|---------|
| Provider | SendGrid (free tier: 100 emails/day) |
| Purpose | Order confirmations, password resets, admin invites |
| Integration | `@medusajs/notification-sendgrid` (already bundled with Medusa) |

The client will own the SendGrid account. We set it up, hand over credentials.

## Prerequisites (Manual)

1. **Upsize droplet** to 4GB RAM in DigitalOcean panel (requires reboot)
2. **Add DNS A records** in Wix DNS:
   - `admin.jeansobs.com` -> `64.23.190.118`
   - `api.jeansobs.com` -> `64.23.190.118`
3. Wait for DNS propagation (~5-30 min)
4. **Create SendGrid account** at https://sendgrid.com
   - Create an API key with "Mail Send" permission
   - Set up Sender Authentication (verify `jeansobs.com` domain or a single sender email)
   - Note: domain verification requires adding CNAME records in Wix DNS

## Deployment Steps

### Step 1: Install System Dependencies

Install Docker, Docker Compose, Nginx, and Certbot on the VPS.

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Nginx + Certbot
apt update && apt install -y nginx certbot python3-certbot-nginx

# Create medusa system user
useradd --system --no-create-home --shell /bin/false medusa

# Create backup directory
mkdir -p /opt/backups

# UFW firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 2: Docker Compose for Data Services

Create `/opt/obs-jeans-data/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: obs-postgres
    restart: always
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_USER: medusa
      POSTGRES_PASSWORD: <generated-strong-password>
      POSTGRES_DB: obs_jeans_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
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
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Start with: `docker compose up -d`

### Step 3: Clone and Configure Medusa

```bash
mkdir -p /opt
cd /opt
git clone <repo-url> obs-jeans-platform
cd obs-jeans-platform
npm ci --omit=dev
```

Create production `/opt/obs-jeans-platform/.env`:

```env
NODE_ENV=production
DATABASE_URL=postgres://medusa:<db-password>@localhost:5432/obs_jeans_platform
REDIS_URL=redis://localhost:6379
STORE_CORS=https://jeansobs.com,https://www.jeansobs.com
ADMIN_CORS=https://admin.jeansobs.com
AUTH_CORS=https://admin.jeansobs.com,https://jeansobs.com,https://www.jeansobs.com
JWT_SECRET=<generated-64-char-secret>
COOKIE_SECRET=<generated-64-char-secret>
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
SENDGRID_API_KEY=SG.<your-sendgrid-api-key>
SENDGRID_FROM=ventas@jeansobs.com
```

### Step 3.5: Configure SendGrid in Medusa (code change before deploy)

Update `medusa-config.ts` to register the SendGrid notification provider:

```typescript
import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

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

This change should be committed and pushed to the repo before deploying.

### Step 4: Build and Run Migrations

```bash
cd /opt/obs-jeans-platform
npm run build
npx medusa db:migrate
```

### Step 5: Create systemd Service

Create `/etc/systemd/system/medusa.service`:

```ini
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
```

Enable and start:

```bash
chown -R medusa:medusa /opt/obs-jeans-platform
systemctl daemon-reload
systemctl enable medusa
systemctl start medusa
```

### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/obs-jeans`:

```nginx
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
```

Enable and test:

```bash
ln -s /etc/nginx/sites-available/obs-jeans /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### Step 7: SSL Certificates

```bash
certbot --nginx -d admin.jeansobs.com -d api.jeansobs.com --non-interactive --agree-tos -m jonas@graterol.dev
```

Certbot auto-configures Nginx for HTTPS and sets up auto-renewal via systemd timer.

### Step 8: Seed Data (Optional — for demo only)

**Skip this step if going straight to production data.**

If you want to demo the platform to the client's team with sample data:

```bash
cd /opt/obs-jeans-platform
npm run seed
# npm run import-products  # Import from Excel (script pending creation)
```

When the demo is done and you're ready for real production data, wipe everything:

```bash
# Stop Medusa first
systemctl stop medusa

# Drop and recreate the database
docker exec obs-postgres psql -U medusa -c "DROP DATABASE obs_jeans_platform;"
docker exec obs-postgres psql -U medusa -c "CREATE DATABASE obs_jeans_platform;"

# Re-run migrations on clean database
cd /opt/obs-jeans-platform
npx medusa db:migrate

# Restart Medusa
systemctl start medusa
```

After wiping, you'll need to re-create the admin user (Step 9) and load real product data.

### Step 9: Create Admin User

```bash
cd /opt/obs-jeans-platform
npx medusa user -e admin@jeansobs.com -p <admin-password>
```

## Security

- **Secrets**: Generated 64-char random strings for JWT_SECRET and COOKIE_SECRET
- **Database**: PostgreSQL bound to 127.0.0.1 only (not exposed to internet)
- **Redis**: Bound to 127.0.0.1 only
- **Firewall**: UFW allows only ports 22, 80, 443
- **SSL/TLS**: Let's Encrypt with auto-renewal
- **CORS**: Restricted to production domains only

## Backup Strategy

Daily PostgreSQL dump via cron:

```bash
# /etc/cron.d/obs-jeans-backup
0 3 * * * root docker exec obs-postgres pg_dump -U medusa obs_jeans_platform | gzip > /opt/backups/obs-jeans-$(date +\%Y\%m\%d).sql.gz && find /opt/backups/ -name "obs-jeans-*.sql.gz" -mtime +7 -delete
```

## Manual Deploy Workflow

```bash
ssh root@64.23.190.118
cd /opt/obs-jeans-platform
git pull origin main
npm ci --omit=dev
npm run build
npx medusa db:migrate  # if schema changes
systemctl restart medusa
```

## Verification Checklist

- [ ] `curl https://api.jeansobs.com/health` returns 200
- [ ] `https://admin.jeansobs.com` loads Medusa admin UI
- [ ] Admin login works with created credentials
- [ ] Products visible after import
- [ ] SSL certificates valid (check in browser)
- [ ] OpenClaw AI agent still running after deployment
- [ ] Firewall blocks direct access to ports 5432, 6379, 9000
- [ ] `redis-cli -h 127.0.0.1 ping` returns PONG
- [ ] Test email delivery (trigger password reset or admin invite)

## Future Improvements

- GitHub Actions CI/CD for automated deploys
- DigitalOcean Spaces for database backup offsite storage
- Monitoring with UptimeRobot or similar
- SSH key-only auth (disable password login)
- Log rotation for journald (`journalctl --vacuum-size=500M`)
