/** Where customers send a bank transfer (Australian direct deposit). Admin marks the order paid once the money arrives. */
export const BANK_TRANSFER = {
  accountName: "Supa Magontong group",
  bsb: "063-172",
  accountNumber: "11524133",
};

/** What a customer puts in the transfer's reference field, so the payment can be matched to their order. */
export const orderReference = (orderId: string) => orderId.slice(0, 8).toUpperCase();
