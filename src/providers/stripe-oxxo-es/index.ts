import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import OxxoProviderService from "@medusajs/payment-stripe/dist/services/stripe-oxxo"

class OxxoEsProviderService extends OxxoProviderService {
  static identifier = "stripe-oxxo"

  get paymentIntentOptions() {
    const base = super.paymentIntentOptions
    return {
      ...base,
      payment_method_options: {
        ...base.payment_method_options,
        oxxo: {
          ...base.payment_method_options?.oxxo,
          preferred_locale: "es_MX",
        },
      },
    } as any
  }
}

export default ModuleProvider(Modules.PAYMENT, {
  services: [OxxoEsProviderService],
})
