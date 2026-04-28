import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { PostStoreOxxoVoucherEmailSchema } from "./validators"

type PostStoreOxxoVoucherEmailType = z.infer<typeof PostStoreOxxoVoucherEmailSchema>

export const POST = async (
  req: MedusaRequest<PostStoreOxxoVoucherEmailType>,
  res: MedusaResponse
) => {
  const notificationService = req.scope.resolve(Modules.NOTIFICATION)
  const {
    email,
    voucher_number,
    voucher_url,
    expires_at,
    order_total,
    currency_code,
  } = req.validatedBody

  const currencyUpper = (currency_code || "MXN").toUpperCase()
  const formattedTotal = `$${order_total.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  const expiresDate = new Date(expires_at).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  await notificationService.createNotifications({
    to: email,
    channel: "email",
    content: {
      subject: "Tu voucher OXXO para pago - OBS Jeans",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #b80049; padding: 28px 40px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">
        OBS Jeans
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 8px 0;">
        Hola,
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
        Tu voucher OXXO ha sido generado. Presentalo en cualquier tienda OXXO para completar tu compra.
      </p>

      <!-- Voucher details -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 2px solid #e5e7eb;">
        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Numero de referencia
        </p>
        <p style="margin: 0 0 20px; color: #111827; font-size: 22px; font-weight: 700; letter-spacing: 2px; font-family: monospace;">
          ${voucher_number}
        </p>

        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Monto a pagar
        </p>
        <p style="margin: 0 0 20px; color: #b80049; font-size: 20px; font-weight: 700;">
          ${formattedTotal} ${currencyUpper}
        </p>

        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Fecha limite de pago
        </p>
        <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">
          ${expiresDate}
        </p>
      </div>

      <!-- Voucher link -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${voucher_url}" style="background-color: #b80049; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px; display: inline-block;">
          Ver voucher completo
        </a>
      </div>

      <!-- Instructions -->
      <div style="margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
          Como pagar
        </p>
        <ol style="color: #374151; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
          <li>Acude a cualquier tienda OXXO</li>
          <li>Indica que deseas hacer un pago de servicio</li>
          <li>Proporciona el numero de referencia</li>
          <li>Realiza el pago en efectivo</li>
        </ol>
      </div>

      <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0 0 24px 0; text-align: center;">
        Tu pedido se confirmara automaticamente una vez que realices el pago.
      </p>

      <!-- Footer message -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 0; text-align: center;">
          Si tienes alguna duda, contactanos por WhatsApp o respondiendo a este correo.
        </p>
      </div>
    </div>

    <!-- Bottom bar -->
    <div style="background-color: #f9fafb; padding: 16px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        OBS Jeans — Desde Jalisco para todo Mexico
      </p>
    </div>
  </div>
</body>
</html>`,
    },
  })

  res.json({ success: true })
}
