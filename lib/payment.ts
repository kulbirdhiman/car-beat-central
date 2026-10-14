/** Where customers send a bank transfer (Australian direct deposit). Admin marks the order paid once the money arrives. */
export const BANK_TRANSFER = {
  accountName: "Supa Magontong group",
  bsb: "063-172",
  accountNumber: "11524133",
};

/** What a customer puts in the transfer's reference field, so the payment can be matched to their order. */
export const orderReference = (orderId: string) => orderId.slice(0, 8).toUpperCase();

/** Ways a customer can pay. Storefront orders offer PayPal and bank transfer; an admin invoice picks its own. */
export const PAYMENT_METHODS = {
  paypal: "PayPal or card",
  bank_transfer: "Bank transfer",
  in_store: "Pay in store (cash or EFTPOS)",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/** What an order offers when it doesn't list its own payment methods (every storefront order). */
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = ["paypal", "bank_transfer"];
