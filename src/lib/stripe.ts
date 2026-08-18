// Stripe price/product mapping for subscription plans
export const STRIPE_PLANS = {
  monthly: {
    id: "monthly",
    name: "Mensal",
    priceId: "price_1TZtxTQ4whpSK2DUbG7Rt4CO",
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
    priceId: "price_1TZtyRQ4whpSK2DULWuMkqyY",
    billingCycle: "quarterly" as const,
    priceMonthly: 43.91,
    priceTotal: 131.73,
    discount: 12,
    popular: true,
    features: [
      "Tudo do plano Mensal",
      "Suporte prioritário",
    ],
  },
  annual: {
    id: "annual",
    name: "Anual",
    priceId: "price_1TZtzSQ4whpSK2DUVFLcsM0g",
    billingCycle: "annual" as const,
    priceMonthly: 33.43,
    priceTotal: 401.21,
    discount: 33,
    features: [
      "Tudo do plano Trimestral",
      "Acesso prioritário a novidades",
      "Badge exclusivo de assinante anual",
    ],
  },
} as const;

export type StripePlanId = keyof typeof STRIPE_PLANS;

export const STRIPE_PLANS_LIST = Object.values(STRIPE_PLANS);

export type ContentArea = "discursivas" | "vade" | "juris" | "cadernos";

export interface ContentPlan {
  id: string;
  planKey: "vade" | "juris" | "combo" | "pro";
  name: string;
  tagline: string;
  priceId: string;
  priceMonthly: number;
  areas: ContentArea[];
  acceptsCoupon: boolean;
  highlight?: boolean;
  features: string[];
}

// Planos de conteúdo (assinatura recorrente mensal)
export const CONTENT_PLANS: ContentPlan[] = [
  {
    id: "vade",
    planKey: "vade",
    name: "Vade Digital",
    tagline: "Vade Mecum completo",
    priceId: "price_1U5caXQ4whpSK2DUhjXypqSP",
    priceMonthly: 14.9,
    areas: ["vade", "cadernos"],
    acceptsCoupon: false,
    features: [
      "Todas as leis liberadas",
      "Notas do professor",
      "Notas privadas e grifos",
      "Remissões entre artigos",
      "Cadernos de estudo",
    ],
  },
  {
    id: "juris",
    planKey: "juris",
    name: "Salinha Juris",
    tagline: "Julgados decodificados",
    priceId: "price_1U5cbZQ4whpSK2DUgAHVfPaN",
    priceMonthly: 19.9,
    areas: ["juris"],
    acceptsCoupon: false,
    features: [
      "Todos os julgados completos",
      "Assistente de IA por julgado",
      "Favoritos e marcação de leitura",
      "Filtros por matéria e assunto",
    ],
  },
  {
    id: "combo",
    planKey: "combo",
    name: "Combo Vade + Juris",
    tagline: "Os dois, com desconto",
    priceId: "price_1U5cboQ4whpSK2DUM2PGGAm1",
    priceMonthly: 24.9,
    areas: ["vade", "cadernos", "juris"],
    acceptsCoupon: true,
    highlight: true,
    features: [
      "Tudo do Vade Digital",
      "Tudo da Salinha Juris",
      "Aceita cupom de desconto",
    ],
  },
  {
    id: "pro",
    planKey: "pro",
    name: "Salinha PRO",
    tagline: "Acesso completo",
    priceId: "price_1U5cm5Q4whpSK2DUHla0Vump",
    priceMonthly: 59.9,
    areas: ["vade", "cadernos", "juris", "discursivas"],
    acceptsCoupon: false,
    features: [
      "Tudo do Combo Vade + Juris",
      "Cadernos ilimitados",
      "Plano Discursivas Mensal incluso",
      "Correção com espelho detalhado",
    ],
  },
];

// Find plan by Stripe price ID
export function getPlanByPriceId(priceId: string) {
  return STRIPE_PLANS_LIST.find((p) => p.priceId === priceId) ?? null;
}

export function getContentPlanByPriceId(priceId: string) {
  return CONTENT_PLANS.find((p) => p.priceId === priceId) ?? null;
}

export function getAnyPlanName(priceId?: string | null) {
  if (!priceId) return null;
  return getPlanByPriceId(priceId)?.name ?? getContentPlanByPriceId(priceId)?.name ?? null;
}
