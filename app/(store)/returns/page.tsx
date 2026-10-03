import type { Metadata } from "next";
import { Banknote, PackageX, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PolicyNote, PolicyPage, PolicySteps, type PolicySection } from "@/components/policy/PolicyPage";
import { SUPPORT_EMAIL } from "@/lib/data";

export const metadata: Metadata = {
  title: "Returns & refunds · CarBeat",
  description: "30-day change-of-mind returns, our fitment guarantee, and how to return a faulty or wrong item.",
};

const HIGHLIGHTS = [
  { icon: RotateCcw, title: "30-day returns", body: "Change of mind is fine on unused items" },
  { icon: ShieldCheck, title: "Fitment guarantee", body: "Doesn't fit your car? We pay return postage" },
  { icon: PackageX, title: "Faulty or wrong item", body: "Repair, replacement or refund, free return" },
  { icon: Banknote, title: "Fast refunds", body: "To your original payment, 3-5 business days" },
];

const SECTIONS: PolicySection[] = [
  {
    id: "change-of-mind",
    title: "Change of mind",
    content: (
      <>
        <p>
          Changed your mind? You can return most items within <strong>30 days of delivery</strong> for a refund or exchange, as long as the item is:
        </p>
        <ul>
          <li>Unused and not installed: no wires cut, spliced or connected to a vehicle</li>
          <li>In its original packaging, with every accessory, harness, manual and fascia it came with</li>
          <li>Returned with your order number or proof of purchase</li>
        </ul>
        <p>
          Return postage for change-of-mind returns is paid by you, and we recommend a tracked service, because items are your responsibility until they reach us. Original
          delivery charges aren&apos;t refundable. We don&apos;t charge a restocking fee on items that come back in resellable condition.
        </p>
      </>
    ),
  },
  {
    id: "fitment",
    title: "Fitment guarantee",
    content: (
      <>
        <p>
          When you shop with your vehicle selected, we only show parts we&apos;ve matched to your make and model. If one of those parts doesn&apos;t fit, we&apos;ll{" "}
          <strong>refund it in full and cover the return postage</strong>, or swap it for one that does.
        </p>
        <p>To claim, let us know within 30 days of delivery and tell us which vehicle you selected. The part needs to be unmodified and in its original packaging.</p>
        <PolicyNote>
          Not sure if something fits? Email us before you install it. We&apos;d much rather check for you than have you pull your dash apart.
        </PolicyNote>
      </>
    ),
  },
  {
    id: "faulty",
    title: "Faulty, damaged or wrong items",
    content: (
      <>
        <p>If your order arrives faulty, damaged in transit, or isn&apos;t what you ordered, we&apos;ll put it right at no cost to you, including return postage.</p>
        <ul>
          <li>
            <strong>Damaged in transit:</strong> please tell us within 7 days of delivery and send photos of the item and the packaging.
          </li>
          <li>
            <strong>Wrong item:</strong> don&apos;t open or install it. Contact us and we&apos;ll arrange the swap.
          </li>
          <li>
            <strong>Faulty item:</strong> send a short description and, if you can, a photo or video of the problem. Faults that appear later are handled under our{" "}
            <Link href="/warranty">warranty policy</Link>.
          </li>
        </ul>
        <p>
          Depending on the problem, we&apos;ll offer a repair, replacement or refund. Your rights under the Australian Consumer Law always apply, and nothing on this page
          limits them.
        </p>
      </>
    ),
  },
  {
    id: "exclusions",
    title: "Items we can't take back for change of mind",
    content: (
      <>
        <p>For hygiene, safety or resale reasons, we can&apos;t accept change-of-mind returns on:</p>
        <ul>
          <li>Products that have been installed, wired in or physically modified</li>
          <li>Custom-made or special-order items, such as made-to-measure fascias, boxes and floor mats</li>
          <li>Floor mats and seat covers that have been used</li>
          <li>Gift cards and fitting vouchers</li>
        </ul>
        <p>These items are still covered if they are faulty, damaged or not as described.</p>
      </>
    ),
  },
  {
    id: "how-to-return",
    title: "How to start a return",
    content: (
      <>
        <p>Please don&apos;t send anything back before we&apos;ve replied: parcels without a return number can be delayed.</p>
        <PolicySteps
          steps={[
            {
              title: "Get in touch",
              body: (
                <>
                  Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order number and the reason for the return.
                </>
              ),
            },
            { title: "Get your return number", body: "We'll reply within one business day with a return number, the address, and a prepaid label if we're covering postage." },
            { title: "Pack and send", body: "Pack the item securely in its original box, write the return number on the outside, and send it with tracking." },
            { title: "Inspection and refund", body: "We inspect returns within 2 business days of arrival, then process your refund or send the replacement." },
          ]}
        />
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    content: (
      <>
        <p>
          Approved refunds go back to your <strong>original payment method</strong> within 3-5 business days of inspection. Your bank or card provider may take a few more
          days to show the money in your account. We&apos;ll email you when it&apos;s sent.
        </p>
        <p>
          If you used a discount code, the refund is for the amount you actually paid. Prefer store credit or an exchange? Just ask, and we can usually ship the exchange as soon
          as your return is on its way.
        </p>
      </>
    ),
  },
  {
    id: "cancellations",
    title: "Cancelling an order",
    content: (
      <>
        <p>
          Need to cancel? Email us as soon as possible. If your order <strong>hasn&apos;t been dispatched</strong>, we&apos;ll cancel it and refund you in full.
        </p>
        <p>Once an order has shipped we can&apos;t stop it, but you can return it under our change-of-mind terms above when it arrives.</p>
      </>
    ),
  },
  {
    id: "fitted",
    title: "Products fitted by CarBeat",
    content: (
      <p>
        If one of our installers fitted your product and something isn&apos;t right, contact us rather than removing it yourself. Fitting work is covered by our 2-year
        workmanship guarantee, and we&apos;ll book you back in to fix it. See the <Link href="/warranty#workmanship">warranty policy</Link> for details.
      </p>
    ),
  },
];

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Returns & refunds"
      description="Changed your mind, got the wrong part, or something isn't working? Here's how returns work at CarBeat, and how to get your money back quickly."
      updated="3 October 2026"
      highlights={HIGHLIGHTS}
      sections={SECTIONS}
      related={{ label: "Read our warranty policy", href: "/warranty" }}
    />
  );
}
