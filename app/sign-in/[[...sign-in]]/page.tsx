import { ClerkProvider, SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const metadata = {
  title: "Sign in · CarBeat",
  robots: { index: false },
};

/** Sign-in for customers and admins alike. Customers land on their account; /admin sends admins here with ?redirect_url=/admin. */
export default function SignInPage() {
  return (
    <ClerkProvider>
      <div className="grid min-h-dvh place-items-center gap-8 px-4 py-10">
        <div className="flex flex-col items-center gap-8">
          <Link href="/">
            <Logo />
          </Link>
          <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/account" signUpFallbackRedirectUrl="/account" />
        </div>
      </div>
    </ClerkProvider>
  );
}
