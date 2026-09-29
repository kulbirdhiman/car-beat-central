"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyCodeButton({ code }: { code: string }) {
  return (
    <Button
      variant="outline"
      className="h-11 gap-3 rounded-full border-dashed border-white/40 bg-black/30 pl-5 pr-4 font-mono tracking-widest text-white backdrop-blur hover:bg-white hover:text-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          toast.success(`Code ${code} copied`, { description: "Paste it at checkout." });
        } catch {
          toast.error("Couldn't copy", { description: `Your code is ${code}` });
        }
      }}
    >
      {code}
      <Copy className="size-4" />
    </Button>
  );
}
