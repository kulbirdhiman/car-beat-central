"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BANK_TRANSFER } from "@/lib/payment";

function Row({ label, value, copy = value }: { label: string; value: string; copy?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        className="flex items-center gap-2 font-mono font-medium tabular-nums hover:text-primary"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success(`${label} copied`);
          } catch {
            toast.error("Couldn't copy", { description: `${label}: ${value}` });
          }
        }}
      >
        {value}
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5 opacity-60" />}
      </button>
    </div>
  );
}

/** Bank details for paying by direct deposit, each tap-to-copy. `reference` is the order number the customer must quote. */
export function BankTransfer({ reference, amount }: { reference: string; amount: string }) {
  return (
    <div className="divide-y text-sm">
      <Row label="Account name" value={BANK_TRANSFER.accountName} />
      <Row label="BSB" value={BANK_TRANSFER.bsb} copy={BANK_TRANSFER.bsb.replace("-", "")} />
      <Row label="Account number" value={BANK_TRANSFER.accountNumber} />
      <Row label="Amount" value={amount} copy={amount.replace(/[^0-9.]/g, "")} />
      <Row label="Reference" value={reference} />
    </div>
  );
}
