// Stripe price/product mapping for subscription plans
export const STRIPE_PLANS = {
  monthly: {
    id: "monthly",
    name: "Mensal",
    priceId: "price_1TBMTPLy0axdgWvJblk2ZJjZ",
    billingCycle: "monthly" as const,
    priceMonthly: 49.90,
    priceTotal: 49.90,
    discount: 0,
    features: [
      "Discursivas ilimitadas",
      "Correção com espelho detalhado",
      "Ranking semanal",
      "Cronômetro de estudos",
      "Badges e gamificação",
    ],
  },
  quarterly: {
    id: "quarterly",
    name: "Trimestral",
    priceId: "price_1TBMTpLy0axdgWvJjbmiZ92u",
    billingCycle: "quarterly" as const,
    priceMonthly: 43.91,
    priceTotal: 131.73,
    discount: 12,
    popular: true,
    features: [
      "Tudo do plano Mensal",
      "12% de desconto",
      "Acesso prioritário a novidades",
      "Suporte prioritário",
    ],
  },
  annual: {
    id: "annual",
    name: "Anual",
    priceId: "price_1TBMUHLy0axdgWvJInHob9Il",
    billingCycle: "annual" as const,
    priceMonthly: 33.43,
    priceTotal: 401.21,
    discount: 33,
    features: [
      "Tudo do plano Trimestral",
      "33% de desconto",
      "Acesso antecipado a funcionalidades",
      "Badge exclusivo de assinante anual",
    ],
  },
} as const;

export type StripePlanId = keyof typeof STRIPE_PLANS;

export const STRIPE_PLANS_LIST = Object.values(STRIPE_PLANS);

// Find plan by Stripe price ID
export function getPlanByPriceId(priceId: string) {
  return STRIPE_PLANS_LIST.find((p) => p.priceId === priceId) ?? null;
}
