"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      className="h-10 gap-3 border-dashed border-primary/50 bg-primary/5 pl-4 pr-3 font-mono font-semibold tracking-[0.15em] text-primary hover:border-solid hover:border-primary hover:bg-primary hover:text-primary-foreground"
      aria-label={`Copy code ${code}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
          toast.success(`Code ${code} copied`, { description: "Paste it at checkout." });
        } catch {
          toast.error("Couldn't copy", { description: `Your code is ${code}` });
        }
      }}
    >
      {code}
      {copied ? <Check className="size-4" /> : <Copy className="size-4 opacity-70" />}
    </Button>
  );
}
