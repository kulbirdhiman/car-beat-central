/** Carriers we ship with, and where a customer tracks a parcel ({n} is the tracking number). */
export const CARRIERS = {
  auspost: { name: "Australia Post", track: "https://auspost.com.au/mypost/track/details/{n}" },
  // StarTrack is part of Australia Post, whose tracker covers its consignments.
  startrack: { name: "StarTrack", track: "https://auspost.com.au/mypost/track/details/{n}" },
  sendle: { name: "Sendle", track: "https://track.sendle.com/tracking?ref={n}" },
  aramex: { name: "Aramex", track: "https://www.aramex.com.au/tools/track?l={n}" },
  couriersplease: { name: "CouriersPlease", track: "https://www.couriersplease.com.au/tools-track/no/{n}" },
  dhl: { name: "DHL Express", track: "https://www.dhl.com/au-en/home/tracking/tracking-express.html?submit=1&tracking-id={n}" },
  tnt: { name: "TNT / FedEx", track: "https://www.tnt.com/express/en_au/site/shipping-tools/tracking.html?searchType=con&cons={n}" },
  toll: { name: "Toll", track: "https://www.mytoll.com/?externalSearchQuery={n}" },
  other: { name: "Other", track: null },
} as const satisfies Record<string, { name: string; track: string | null }>;

export type Carrier = keyof typeof CARRIERS;

export const CARRIER_KEYS = Object.keys(CARRIERS) as Carrier[];

export function isCarrier(value: unknown): value is Carrier {
  return typeof value === "string" && value in CARRIERS;
}

/** The carrier's tracking page for a parcel, when we know it. */
export function trackingUrl(carrier: Carrier, trackingNumber: string) {
  const template = CARRIERS[carrier].track;
  return template ? template.replace("{n}", encodeURIComponent(trackingNumber)) : null;
}

/** How an order was sent: set when it's marked shipped. */
export type Shipment = { carrier: Carrier; trackingNumber: string };
