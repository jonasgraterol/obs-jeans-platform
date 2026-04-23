# Stripe - Checklist para Produccion

## Prerequisitos

Antes de comenzar, el cliente debe tener:
- Cuenta Stripe activada con entidad mexicana (ver guia para el cliente abajo)
- Live API keys disponibles en el dashboard de Stripe

## Paso 1: Obtener Live API Keys

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
2. Asegurarse de estar en modo **Production** (no Test)
3. Copiar:
   - **Secret key** (`sk_live_...`)
   - **Publishable key** (`pk_live_...`)

## Paso 2: Configurar Backend (VPS)

Conectarse al VPS de produccion y agregar las variables al `.env`:

```bash
ssh root@<PRODUCTION_IP>
nano /opt/obs-jeans-platform/.env
```

Agregar/reemplazar:
```
STRIPE_API_KEY=sk_live_XXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

> Nota: El `STRIPE_WEBHOOK_SECRET` se obtiene en el Paso 4 despues de crear el webhook.

Reiniciar Medusa:
```bash
systemctl restart medusa
```

## Paso 3: Configurar Storefront (Vercel)

1. Ir a [Vercel Dashboard](https://vercel.com) → Proyecto del storefront → Settings → Environment Variables
2. Agregar/actualizar:
   - **Name:** `NEXT_PUBLIC_STRIPE_KEY`
   - **Value:** `pk_live_XXXXXXXXXXXX`
3. Hacer redeploy del storefront

## Paso 4: Configurar Webhooks en Stripe

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Crear **dos** endpoints:

### Webhook para tarjetas
- **URL:** `https://api.jeansobs.com/hooks/payment/stripe_stripe`
- **Eventos:**
  - `payment_intent.amount_capturable_updated`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.partially_funded`

### Webhook para OXXO
- **URL:** `https://api.jeansobs.com/hooks/payment/stripe-oxxo_stripe`
- **Eventos:** (los mismos)
  - `payment_intent.amount_capturable_updated`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.partially_funded`

3. Una vez creados, copiar el **Signing secret** (`whsec_...`) de cualquiera de los dos (es el mismo si se crean bajo la misma cuenta)
4. Agregar el signing secret al `.env` del backend como `STRIPE_WEBHOOK_SECRET` (Paso 2)
5. Reiniciar Medusa:
```bash
systemctl restart medusa
```

## Paso 5: Habilitar Providers en Medusa Admin

1. Abrir el admin panel de produccion (https://admin.jeansobs.com/app)
2. Ir a **Settings → Regions → Mexico**
3. Editar la region y habilitar:
   - **Stripe (STRIPE)** — tarjetas de credito/debito
   - **Stripe Oxxo (STRIPE)** — pagos en efectivo
4. Guardar

## Paso 6: Habilitar OXXO en Stripe

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com) → Settings → Payment Methods
2. Verificar que **OXXO** esta habilitado
3. Si no aparece, activarlo manualmente

## Paso 7: Verificacion

### Probar tarjeta (modo live)
1. Abrir el storefront de produccion
2. Agregar un producto al carrito
3. Ir al checkout, seleccionar Credit card
4. Usar una tarjeta real (se puede hacer un cobro pequeno y reembolsarlo despues desde el dashboard de Stripe)
5. Verificar que la orden aparece en Medusa Admin

### Probar OXXO (modo live)
1. Seleccionar "Pago en OXXO" en el checkout
2. Verificar que se genera el voucher con el logo de OXXO
3. No es necesario pagar el voucher para verificar — el voucher se generara con datos reales

### Verificar webhooks
1. En Stripe Dashboard → Developers → Webhooks
2. Verificar que los endpoints muestran status **Enabled**
3. Despues de una prueba de pago, verificar que los eventos aparecen con status **200**

## Comisiones Stripe Mexico

| Metodo | Comision |
|---|---|
| Tarjeta credito/debito | 3.6% + $3.00 MXN |
| OXXO | 3.6% + $3.00 MXN |

Las comisiones se descuentan automaticamente del monto cobrado. Los depositos a la cuenta bancaria del cliente se hacen automaticamente segun el calendario configurado en Stripe (por defecto cada 2 dias habiles).

## Notas Importantes

- **Nunca compartir la Secret key** (`sk_live_...`) — solo va en el `.env` del servidor
- La **Publishable key** (`pk_live_...`) es publica y va en el frontend — es seguro exponerla
- Los webhooks son **esenciales** para que los pagos OXXO se confirmen automaticamente
- Sin webhooks, los pagos con tarjeta funcionan pero los pagos OXXO nunca se confirmarian
- El `STRIPE_WEBHOOK_SECRET` cambia si recreas el webhook — hay que actualizarlo en el `.env`
