# OBS Jeans Platform

E-commerce platform for **OBS Jeans** — a jeans factory based in Jalisco, Mexico. Built on [Medusa v2](https://medusajs.com/).

## URLs

| Environment | Admin Panel | API |
|-------------|-------------|-----|
| Production  | https://admin.jeansobs.com/app | https://api.jeansobs.com |
| Staging     | https://admin-staging.jeansobs.com/app | https://api-staging.jeansobs.com |

## Tech Stack

- **Backend**: Medusa v2 (Node.js)
- **Database**: PostgreSQL (Docker)
- **Cache**: Redis (Docker)
- **File Storage**: Local (`@medusajs/medusa/file-local`)
- **Email**: SendGrid
- **Hosting**: DigitalOcean VPS (Ubuntu 24.04)
- **SSL**: Let's Encrypt (Certbot, auto-renew)
- **Reverse Proxy**: Nginx

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose (for PostgreSQL + Redis)
- 4 GB RAM minimum (2 GB swap recommended for builds)

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.template .env
# Edit .env with your local DATABASE_URL, REDIS_URL, etc.

# Run database migrations
npx medusa db:migrate

# Start development server
npm run dev
```

Admin panel available at `http://localhost:9000/app`

### Production Build

```bash
npm run build

# Copy admin build to public directory (required for Medusa v2)
cp -r .medusa/server/public/admin public/admin

# Fix ownership if built as root
chown -R medusa:medusa .

# Start production server
npx medusa start
```

## File Storage Configuration

Product images and media are handled by the Medusa File Module. Currently using the **local file provider** which stores uploads in the `static/` directory.

### Configuration in `medusa-config.ts`

```ts
{
  resolve: "@medusajs/medusa/file",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/file-local",
        id: "local",
        options: {
          backend_url: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000/static",
        },
      },
    ],
  },
},
```

### Important

- `MEDUSA_BACKEND_URL` **must** end with `/static` (e.g. `https://api.jeansobs.com/static`). Without it, uploaded file URLs will be missing the `/static/` path prefix and images will return 404.
- The `static/` directory is auto-created by Medusa and served publicly.
- For production, consider migrating to `@medusajs/medusa/file-s3` or DigitalOcean Spaces.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://medusa:pass@localhost:5432/obs_jeans` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | (generate a random string) |
| `COOKIE_SECRET` | Cookie signing secret | (generate a random string) |
| `STORE_CORS` | Storefront CORS origins | `https://jeansobs.com` |
| `ADMIN_CORS` | Admin panel CORS origins | `https://admin.jeansobs.com` |
| `AUTH_CORS` | Auth CORS origins | `https://admin.jeansobs.com,https://jeansobs.com` |
| `MEDUSA_BACKEND_URL` | Public API URL with `/static` suffix | `https://api.jeansobs.com/static` |
| `SENDGRID_API_KEY` | SendGrid API key for emails | `SG.xxx` |
| `SENDGRID_FROM` | Sender email address | `ventas@jeansobs.com` |

## Internal Usage Guides

Operational guides for the OBS Jeans team are available in [`docs/guia-uso`](./docs/guia-uso/README.md):

- Cómo agregar productos
- Cómo ajustar inventario
- Cómo procesar órdenes
- Cómo generar reportes
- FAQ interno
- Plan de screenshots paso a paso

## Jeany / IA Knowledge Base

Internal AI assistant documentation:

- [`docs/CONOCIMIENTO_AGENTE.md`](./docs/CONOCIMIENTO_AGENTE.md) — base de conocimiento inicial de Jeany.
- [`docs/automatizaciones/reporte-matutino.md`](./docs/automatizaciones/reporte-matutino.md) — reporte matutino automático al equipo.

## Deployment

The application runs as a systemd service (`medusa.service`) behind Nginx with SSL.

```bash
# Check service status
systemctl status medusa

# Restart after config changes
systemctl restart medusa

# View logs
journalctl -u medusa -f
```

### Deploy Checklist

1. Pull latest code
2. `npm install`
3. `npm run build`
4. `cp -r .medusa/server/public/admin public/admin`
5. `chown -R medusa:medusa .`
6. `systemctl restart medusa`

## Project Structure

```
obs-jeans-platform/
  src/
    admin/          # Admin UI customizations
    api/            # Custom API routes
    modules/        # Custom modules
    scripts/        # Seed & import scripts
    workflows/      # Custom workflows
  static/           # Uploaded files (auto-managed by file module)
  public/admin/     # Built admin panel (copied after build)
  medusa-config.ts  # Main configuration
  .env              # Environment variables
```

## License

Private - All rights reserved.
