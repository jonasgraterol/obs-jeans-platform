import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { payment_intent_id } = req.body as { payment_intent_id?: string }

  if (!payment_intent_id || !process.env.STRIPE_API_KEY) {
    res.status(400).json({ error: "Missing payment_intent_id or Stripe key" })
    return
  }

  const stripe = new Stripe(process.env.STRIPE_API_KEY)

  await stripe.paymentIntents.update(payment_intent_id, {
    payment_method_options: {
      oxxo: {
        expires_after_days: 3,
        preferred_locale: "es_MX" as any,
      },
    },
  })

  res.json({ success: true })
}
