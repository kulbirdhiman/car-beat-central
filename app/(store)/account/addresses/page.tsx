import { MapPin } from "lucide-react";
import { AddressCard, AddressDialog } from "@/components/account/Addresses";
import { Button } from "@/components/ui/button";
import { listAddresses } from "@/lib/server/account";
import { requireCustomer } from "@/lib/server/customer";

export const metadata = { title: "My addresses · CarBeat", robots: { index: false } };

export default async function AddressesPage() {
  const customer = await requireCustomer("/account/addresses");
  const addresses = await listAddresses(customer.id);
  const add = <Button size="lg">Add address</Button>;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Addresses</h1>
          <p className="mt-2 text-muted-foreground">Your default address is filled in for you at checkout.</p>
        </div>
        {addresses.length > 0 && <AddressDialog trigger={add} />}
      </div>
      {addresses.length ? (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard key={a.id} address={a} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed p-12 text-center">
          <MapPin className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 font-display text-2xl font-bold">No saved addresses</p>
          <p className="mt-1 text-sm text-muted-foreground">Add one now, or we&apos;ll save the address from your first order.</p>
          <div className="mt-6">
            <AddressDialog trigger={add} />
          </div>
        </div>
      )}
    </>
  );
}
