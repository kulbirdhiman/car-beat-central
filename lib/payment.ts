/** Where customers send a bank transfer (Australian direct deposit). Admin marks the order paid once the money arrives. */
export const BANK_TRANSFER = {
  accountName: "Supa Magontong group",
  bsb: "063-172",
  accountNumber: "11524133",
};

/** The same public order number on customer pages, payments, and admin invoices. */
export function orderReference(order: { id: string; number: number; source?: string | null }) {
  return order.source === "legacy" && order.id.startsWith("woo-") ? `WC-${order.id.slice(4)}` : `CB-${order.number}`;
}

/** Also accept references customers received before public order numbers were unified. */
export function matchesOrderReference(order: { id: string; number: string }, query: string) {
  const reference = query.trim().replace(/^#\s*/, "").toLowerCase();
  if (!reference) return false;
  return [order.number, order.id, order.id.slice(0, 8)].some((value) => value.toLowerCase().includes(reference));
}

/** Ways a customer can pay. Storefront orders offer PayPal, Afterpay and bank transfer; an admin invoice picks its own. */
export const PAYMENT_METHODS = {
  paypal: "PayPal or card",
  afterpay: "Afterpay",
  bank_transfer: "Bank transfer",
  in_store: "Pay in store (cash or EFTPOS)",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/** What an order offers when it doesn't list its own payment methods (every storefront order). */
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = ["paypal", "afterpay", "bank_transfer"];
