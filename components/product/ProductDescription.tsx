import { productDescriptionText, sanitizeProductDescription } from "@/lib/product-description";

export function ProductDescription({ description, className = "" }: { description: string; className?: string }) {
  return (
    <div
      className={`product-description [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:font-semibold [&_img]:my-4 [&_img]:max-h-[32rem] [&_img]:max-w-full [&_img]:rounded-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeProductDescription(description) }}
    />
  );
}

export { productDescriptionText };
