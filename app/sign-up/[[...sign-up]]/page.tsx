import { ClerkProvider, SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const metadata = {
  title: "Create account · CarBeat",
  robots: { index: false },
};

export default function SignUpPage() {
  return (
    <ClerkProvider>
      <div className="grid min-h-dvh place-items-center gap-8 px-4 py-10">
        <div className="flex flex-col items-center gap-8">
          <Link href="/">
            <Logo />
          </Link>
          <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/account" signInFallbackRedirectUrl="/account" />
        </div>
      </div>
    </ClerkProvider>
  );
}
