import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <p className="label-mono mt-14 text-muted-foreground">Error 404</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold sm:text-7xl">
          Wrong <span className="text-primary">turn.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-muted-foreground">We couldn&apos;t find that page. It may have moved or sold out.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="xl">
            <Link href="/shop">Shop all parts</Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
