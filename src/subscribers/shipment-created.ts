import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }

  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  // The event payload has the fulfillment ID, we need to find the order
  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: [
      "id",
      "tracking_links.*",
      "labels.*",
      "items.title",
      "items.quantity",
    ],
    filters: { id: data.id },
  })

  if (!fulfillment) {
    return
  }

  // Find the order linked to this fulfillment
  const {
    data: orders,
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "fulfillments.id",
    ],
    filters: {
      fulfillments: { id: data.id },
    },
  })

  const order = orders?.[0]

  if (!order || !order.email) {
    return
  }

  const firstName = order.shipping_address?.first_name || ""

  const trackingLinks = fulfillment.tracking_links || []
  const trackingHtml = trackingLinks.length > 0
    ? trackingLinks
        .map(
          (link: any) => `
          <a href="${link.url}" style="color: #b80049; text-decoration: underline; font-size: 14px;">
            ${link.tracking_number || link.url}
          </a>`
        )
        .join("<br>")
    : null

  const itemsHtml = (fulfillment.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 14px;">
          ${item.title}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: center; color: #374151; font-size: 14px;">
          ${Number(item.quantity)}
        </td>
      </tr>`
    )
    .join("")

  const shippingAddr = order.shipping_address
  const addressHtml = shippingAddr
    ? `${shippingAddr.first_name} ${shippingAddr.last_name}<br>
       ${shippingAddr.address_1 || ""}${shippingAddr.address_2 ? ", " + shippingAddr.address_2 : ""}<br>
       ${shippingAddr.city || ""}${shippingAddr.province ? ", " + shippingAddr.province : ""} ${shippingAddr.postal_code || ""}`
    : ""

  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    content: {
      subject: `Tu pedido #${order.display_id} ha sido enviado - OBS Jeans`,
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
        Hola ${firstName},
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
        Tu pedido <strong>#${order.display_id}</strong> ha sido enviado.
      </p>

      ${trackingHtml ? `
      <!-- Tracking -->
      <div style="background-color: #fdf2f8; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid rgba(184,0,73,0.1);">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Numero de rastreo
        </p>
        ${trackingHtml}
      </div>` : ""}

      <!-- Items shipped -->
      ${itemsHtml ? `
      <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
        Productos enviados
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>` : ""}

      <!-- Shipping address -->
      ${shippingAddr ? `
      <div style="margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
          Direccion de entrega
        </p>
        <p style="color: #374151; font-size: 14px; line-height: 22px; margin: 0;">
          ${addressHtml}
        </p>
      </div>` : ""}

      <!-- Footer message -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 0; text-align: center;">
          Si tienes alguna duda sobre tu envio, contactanos por WhatsApp o respondiendo a este correo.
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
  event: "shipment.created",
}
