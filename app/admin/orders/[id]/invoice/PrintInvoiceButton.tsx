"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintInvoiceButton() {
  return <Button onClick={() => window.print()}><Printer /> Print / save as PDF</Button>;
}
