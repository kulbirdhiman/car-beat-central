"use client";

import { useState } from "react";
import { ProductForm } from "../ProductForm";

export function NewProduct() {
  // Bumped by "Save & add another" to start a fresh, empty form.
  const [round, setRound] = useState(0);
  return <ProductForm key={round} product={null} onAddAnother={() => setRound((n) => n + 1)} />;
}
