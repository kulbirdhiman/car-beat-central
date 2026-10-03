import type { Metadata } from "next";
import { BadgeCheck, Scale, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { PolicyNote, PolicyPage, PolicySteps, type PolicySection } from "@/components/policy/PolicyPage";
import { SUPPORT_EMAIL } from "@/lib/data";

export const metadata: Metadata = {
  title: "Warranty · CarBeat",
  description: "What our product warranty and 2-year installation workmanship guarantee cover, and how to make a claim.",
};

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "12-month warranty", body: "On every product, or longer where stated" },
  { icon: Wrench, title: "2-year workmanship", body: "On installs done by CarBeat fitters" },
  { icon: BadgeCheck, title: "Genuine stock", body: "Sourced from authorised suppliers" },
  { icon: Scale, title: "Consumer Law", body: "Your statutory rights always apply" },
];

const SECTIONS: PolicySection[] = [
  {
    id: "acl",
    title: "Your rights under Australian Consumer Law",
    content: (
      <>
        <PolicyNote>
          Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a replacement or refund for a major failure and
          compensation for any other reasonably foreseeable loss or damage. You are also entitled to have the goods repaired or replaced if the goods fail to be of acceptable
          quality and the failure does not amount to a major failure.
        </PolicyNote>
        <p>
          The warranty on this page is <strong>in addition to</strong> those rights, not instead of them. If anything here seems to conflict with the Australian Consumer Law,
          the law wins.
        </p>
      </>
    ),
  },
  {
    id: "coverage",
    title: "What our warranty covers",
    content: (
      <>
        <p>
          Every product we sell is covered against <strong>defects in materials and manufacturing</strong> for at least <strong>12 months from delivery</strong>. Some brands
          offer longer cover. When they do, it&apos;s shown on the product page and we&apos;ll honour it.
        </p>
        <p>If a covered fault appears during normal use, we&apos;ll repair the item, replace it with the same or an equivalent model, or refund you if neither is possible.</p>
        <p>Warranty cover belongs to the original purchaser and needs proof of purchase. Your CarBeat order confirmation email is enough.</p>
      </>
    ),
  },
  {
    id: "not-covered",
    title: "What isn't covered",
    content: (
      <>
        <p>Our warranty covers faults in the product itself. It doesn&apos;t cover damage caused by:</p>
        <ul>
          <li>Incorrect installation or wiring, such as reversed polarity, missing fuses or poor earthing</li>
          <li>Driving speakers or subwoofers beyond their rated power, or with a distorted (clipped) signal</li>
          <li>Water, impact, fire, theft or other accidents</li>
          <li>Electrical faults in the vehicle, such as voltage spikes or a failing alternator</li>
          <li>Opening, repairing or modifying the product, or installing unofficial firmware</li>
          <li>Normal wear and tear, including scratches, faded finishes and cosmetic marks</li>
        </ul>
        <p>
          Having the product installed by someone other than CarBeat <strong>doesn&apos;t void your warranty</strong>. We only decline a claim if the installation itself caused
          the fault.
        </p>
      </>
    ),
  },
  {
    id: "workmanship",
    title: "2-year installation workmanship guarantee",
    content: (
      <>
        <p>
          When a CarBeat installer fits a product, our workmanship is guaranteed for <strong>2 years from the fitting date</strong>. That includes the wiring, connections, trim
          and mounting we did. If something we fitted comes loose, rattles, loses connection or stops working because of our work, we&apos;ll fix it at no cost.
        </p>
        <p>
          If a product we installed develops a warranty fault, we also handle the removal and refitting for you, at no extra charge.
        </p>
      </>
    ),
  },
  {
    id: "claim",
    title: "How to make a warranty claim",
    content: (
      <>
        <PolicySteps
          steps={[
            {
              title: "Tell us what's happening",
              body: (
                <>
                  Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order number, your vehicle, and a description of the problem.
                </>
              ),
            },
            { title: "Show us", body: "Photos or a short video of the fault help us diagnose it quickly, and often mean we can fix it over email." },
            { title: "Quick troubleshooting", body: "Our team may suggest a few checks first. Many issues are a setting, a fuse or a loose connector." },
            { title: "Assessment and outcome", body: "If the product needs to come back, we send a prepaid label, assess it within 5 business days, then repair, replace or refund." },
          ]}
        />
        <p>If your product was fitted by CarBeat, just contact us. We&apos;ll book you in with your installer instead of asking you to remove it.</p>
      </>
    ),
  },
  {
    id: "costs",
    title: "Postage, removal and fitting costs",
    content: (
      <>
        <p>
          For approved warranty claims, <strong>we pay the postage both ways</strong>. If we assess a returned item and find no fault, or find the fault isn&apos;t covered,
          we&apos;ll explain why and send it back to you. Before we do any paid repair, we&apos;ll quote you first.
        </p>
        <p>
          If an independent installer fitted the product, their removal and refitting charges aren&apos;t covered by our warranty, except where the Australian Consumer Law
          says otherwise.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        We may update this policy from time to time. The version that applies to you is the one published on the date you placed your order. For returns of new items, see our{" "}
        <Link href="/returns">returns &amp; refunds policy</Link>.
      </p>
    ),
  },
];

export default function WarrantyPage() {
  return (
    <PolicyPage
      title="Warranty"
      description="Every product is covered, every CarBeat install is guaranteed, and your Australian Consumer Law rights always come first. Here's what that means in practice."
      updated="3 October 2026"
      highlights={HIGHLIGHTS}
      sections={SECTIONS}
      related={{ label: "Read our returns policy", href: "/returns" }}
    />
  );
}
