import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function inviteCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve("query")

  const {
    data: [invite],
  } = await query.graph({
    entity: "invite",
    fields: ["id", "email", "token"],
    filters: { id: data.id },
  })

  if (!invite) {
    return
  }

  const inviteUrl = `https://admin.jeansobs.com/app/invite?token=${invite.token}`

  await notificationService.createNotifications({
    to: invite.email,
    channel: "email",
    content: {
      subject: "Has sido invitado a OBS Jeans Admin",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 40px;">
    <h1 style="color: #111827; font-size: 22px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
      OBS Jeans
    </h1>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 16px 0;">
      Hola,
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      Has sido invitado a unirte al panel de administración de OBS Jeans. Haz clic en el botón de abajo para aceptar la invitación y configurar tu cuenta.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" style="background-color: #111827; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px; display: inline-block;">
        Aceptar invitación
      </a>
    </div>
    <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 24px 0 0 0; text-align: center;">
      Si no esperabas esta invitación, puedes ignorar este correo.
    </p>
  </div>
</body>
</html>`,
    },
  })
}

export const config: SubscriberConfig = {
  event: ["invite.created", "invite.resent"],
}
