import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "created_at",
      "currency_code",
      "total",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "shipping_address.first_name",
    ],
    filters: { id: data.id },
  })

  if (!order || !order.email) {
    return
  }

  const firstName = order.shipping_address?.first_name || ""
  const currencyCode = (order.currency_code || "MXN").toUpperCase()

  const formatPrice = (amount: any) => {
    const value = Math.abs(Number(amount))
    if (!value && value !== 0) return "$0.00"
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">
          ${item.product_title}${item.variant_title ? ` — Talla ${item.variant_title}` : ""}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: center; color: #374151; font-size: 14px;">
          ${Number(item.quantity) || 1}
        </td>
      </tr>`
    )
    .join("")

  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    content: {
      subject: `Tu pedido #${order.display_id} ha sido cancelado - OBS Jeans`,
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
    <div style="background-color: #78716C; padding: 28px 40px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px;">
        OBS Jeans
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 8px 0;">
        Hola ${firstName},
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
        Te informamos que tu pedido <strong>#${order.display_id}</strong> ha sido cancelado.
      </p>

      <!-- Order summary -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">
          Pedido: <strong style="color: #111827;">#${order.display_id}</strong>
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">
          Total: <strong style="color: #111827;">${formatPrice(order.total)} ${currencyCode}</strong>
        </p>
      </div>

      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Producto
            </th>
            <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Cant.
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="color: #374151; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
        Si realizaste un pago, el reembolso se procesara automaticamente. El tiempo de reflejo depende de tu metodo de pago.
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
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
