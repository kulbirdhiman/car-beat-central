"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyCodeButton({ code }: { code: string }) {
  return (
    <Button
      variant="outline"
      className="h-11 gap-3 border-dashed border-white/45 bg-black/35 pl-4 pr-3.5 font-mono tracking-[0.15em] text-white backdrop-blur-md hover:border-solid hover:bg-white hover:text-foreground"
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
      <Copy className="size-4 opacity-70" />
    </Button>
  );
}
