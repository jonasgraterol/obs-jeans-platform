import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
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
      "item_total",
      "shipping_total",
      "tax_total",
      "discount_total",
      "items.id",
      "items.title",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "shipping_address.phone",
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
    if (isNaN(value)) return "$0.00"
    return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => {
        const qty = Number(item.quantity) || 1
        const unitPrice = Number(item.unit_price) || 0
        const lineTotal = unitPrice * qty
        return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 500;">${item.product_title || item.title}</p>
          ${item.variant_title ? `<p style="margin: 2px 0 0; color: #6b7280; font-size: 13px;">Talla: ${item.variant_title}</p>` : ""}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: center; color: #374151; font-size: 14px;">
          ${qty}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #374151; font-size: 14px;">
          ${formatPrice(lineTotal)}
        </td>
      </tr>`
      }
    )
    .join("")

  const shippingAddr = order.shipping_address
  const addressHtml = shippingAddr
    ? `${shippingAddr.address_1 || ""}${shippingAddr.address_2 ? ", " + shippingAddr.address_2 : ""}<br>
       ${shippingAddr.city || ""}${shippingAddr.province ? ", " + shippingAddr.province : ""} ${shippingAddr.postal_code || ""}<br>
       ${shippingAddr.country_code?.toUpperCase() || ""}`
    : ""

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    content: {
      subject: `Confirmacion de pedido #${order.display_id} - OBS Jeans`,
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
        Hemos recibido tu pedido <strong>#${order.display_id}</strong>. Gracias por tu compra.
      </p>

      <!-- Order details -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">
          Pedido: <strong style="color: #111827;">#${order.display_id}</strong><br>
          Fecha: ${orderDate}
        </p>
      </div>

      <!-- Items table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Producto
            </th>
            <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Cant.
            </th>
            <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Precio
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
          <td style="padding: 4px 0; text-align: right; color: #374151; font-size: 14px;">${formatPrice(order.item_total)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Envio</td>
          <td style="padding: 4px 0; text-align: right; color: #374151; font-size: 14px;">${formatPrice(order.shipping_total)}</td>
        </tr>
        ${order.discount_total ? `
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Descuento</td>
          <td style="padding: 4px 0; text-align: right; color: #16a34a; font-size: 14px;">-${formatPrice(order.discount_total)}</td>
        </tr>` : ""}
        ${order.tax_total ? `
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Impuestos</td>
          <td style="padding: 4px 0; text-align: right; color: #374151; font-size: 14px;">${formatPrice(order.tax_total)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 12px 0 4px; color: #111827; font-size: 16px; font-weight: 700; border-top: 2px solid #e5e7eb;">Total</td>
          <td style="padding: 12px 0 4px; text-align: right; color: #b80049; font-size: 16px; font-weight: 700; border-top: 2px solid #e5e7eb;">${formatPrice(order.total)} ${currencyCode}</td>
        </tr>
      </table>

      <!-- Shipping address -->
      ${shippingAddr ? `
      <div style="margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">
          Direccion de envio
        </p>
        <p style="color: #374151; font-size: 14px; line-height: 22px; margin: 0;">
          ${shippingAddr.first_name} ${shippingAddr.last_name}<br>
          ${addressHtml}
          ${shippingAddr.phone ? `<br>Tel: ${shippingAddr.phone}` : ""}
        </p>
      </div>` : ""}

      <!-- Footer message -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 0; text-align: center;">
          Si tienes alguna duda sobre tu pedido, contactanos por WhatsApp o respondiendo a este correo.
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
  event: "order.placed",
}
