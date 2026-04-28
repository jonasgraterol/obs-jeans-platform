import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostStoreOxxoVoucherEmailSchema } from "./store/oxxo-voucher-email/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/oxxo-voucher-email",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostStoreOxxoVoucherEmailSchema),
      ],
    },
  ],
})
