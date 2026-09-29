import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <p className="mt-10 font-display text-8xl font-extrabold text-primary">404</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase">Wrong turn</h1>
        <p className="mt-2 text-muted-foreground">We couldn&apos;t find that page. It may have moved or sold out.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/shop">Shop all parts</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
