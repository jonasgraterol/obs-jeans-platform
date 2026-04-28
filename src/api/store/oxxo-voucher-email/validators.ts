import { z } from "@medusajs/framework/zod"

export const PostStoreOxxoVoucherEmailSchema = z.object({
  email: z.string().email(),
  voucher_number: z.string(),
  voucher_url: z.string().url(),
  expires_at: z.string(),
  order_total: z.number(),
  currency_code: z.string(),
})
