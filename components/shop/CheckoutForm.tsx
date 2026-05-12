"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CartLine } from "./types";
import { useTableSession } from "../tableContext";

const STORAGE_KEY = "ronis-cart-v1";
const MODE_KEY = "ronis-cart-mode-v1";

interface Props {
  locations: { id: string; label: string }[];
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    points: number;
  } | null;
}

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function CheckoutForm({ locations, customer }: Props) {
  const { table: tableSession, setTable } = useTableSession();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [mode, setMode] = useState<"eat-in" | "takeaway">("takeaway");
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(locations[0]?.id ?? "");
  const [pickupTime, setPickupTime] = useState("");
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [tableZone, setTableZone] = useState<"inside" | "outside">("inside");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw) as CartLine[]);
      const m = localStorage.getItem(MODE_KEY);
      if (m === "eat-in" || m === "takeaway") setMode(m);
    } catch {}
  }, []);

  // If a table session is active, lock us into eat-in at that location
  // and pre-fill the table number.
  useEffect(() => {
    if (tableSession) {
      setMode("eat-in");
      setPickupLocation(tableSession.locationId);
      setTableNumber(String(tableSession.table));
      setTableZone(tableSession.zone);
    }
  }, [tableSession]);

  // Sensible default pickup time — 30 min from now, rounded up to next 5.
  useEffect(() => {
    if (pickupTime) return;
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const m = Math.ceil(d.getMinutes() / 5) * 5;
    d.setMinutes(m, 0, 0);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    setPickupTime(`${hh}:${mm}`);
  }, [pickupTime]);

  const subtotal = cart.reduce((s, l) => s + l.unitPricePence * l.quantity, 0);
  const lineDiscounts = cart.reduce((s, l) => s + l.discountPence * l.quantity, 0);
  const REWARD_VALUE = 500;
  const REWARD_COST = 100;
  const canRedeem = !!customer && customer.points >= REWARD_COST;
  const loyaltyDiscount = redeemPoints && canRedeem ? REWARD_VALUE : 0;
  const total = Math.max(0, subtotal - lineDiscounts - loyaltyDiscount);
  const earnedPoints = Math.floor(total / 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      // Eat-in must have a table number (the user explicitly asked).
      if (mode === "eat-in" && !tableNumber.trim()) {
        setStatus("error");
        setError("Please enter your table number for eat-in orders.");
        return;
      }
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          customer: { name, email, phone, customerId: customer?.id ?? null },
          pickup: { locationId: pickupLocation, time: pickupTime, notes },
          service: mode === "eat-in"
            ? { mode: "eat-in", table: Number(tableNumber), zone: tableZone }
            : { mode: "takeaway" },
          redeemPoints: redeemPoints && canRedeem,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `Server returned ${res.status}`);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setOrderId(json.orderId ?? null);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-saffron/30 p-10 text-center">
        <p className="font-display font-700 text-4xl text-coffee">Thank you.</p>
        <p className="editorial mt-4">
          Your order is in our system{orderId && ` — reference ${orderId}`}.
          We&rsquo;ll have it ready at{" "}
          <strong className="font-700">
            {locations.find((l) => l.id === pickupLocation)?.label}
          </strong>{" "}
          for{" "}
          <strong className="font-700">{pickupTime}</strong>.
        </p>
        <p className="editorial mt-3 text-muted">
          A copy of your order has been emailed to{" "}
          <strong className="font-600">{email}</strong>.
        </p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          <span>Back to the shop</span>
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="rounded-xl bg-ivory p-10 text-center shadow-soft">
        <p className="font-display font-700 text-coffee text-2xl">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          <span>Browse the shop</span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 md:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {/* MODE */}
        <section className="rounded-xl bg-ivory p-6 shadow-soft">
          <h2 className="font-display font-700 text-coffee text-xl">How are you having it?</h2>
          <div className="mt-4 inline-flex rounded-pill bg-cream shadow-soft p-1.5 gap-1">
            <button
              type="button"
              onClick={() => setMode("takeaway")}
              aria-pressed={mode === "takeaway"}
              className={`inline-flex items-center justify-center min-h-11 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                mode === "takeaway" ? "bg-brick text-cream shadow-chip" : "text-coffee hover:bg-saffron/30"
              }`}
            >
              Takeaway
            </button>
            <button
              type="button"
              onClick={() => setMode("eat-in")}
              aria-pressed={mode === "eat-in"}
              className={`inline-flex items-center justify-center min-h-11 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                mode === "eat-in" ? "bg-saffron text-coffee shadow-chip" : "text-coffee hover:bg-saffron/30"
              }`}
            >
              Eat in
            </button>
          </div>
          {tableSession && (
            <p className="mt-3 font-sans text-sm text-coffee/80">
              You scanned a QR for{" "}
              <strong className="font-700">
                Table {tableSession.table} ({tableSession.zone})
              </strong>{" "}
              — locked to eat-in.{" "}
              <button
                type="button"
                onClick={() => setTable(null)}
                className="anchor font-600"
              >
                Clear table
              </button>
            </p>
          )}
        </section>

        {/* PICKUP */}
        <section className="rounded-xl bg-ivory p-6 shadow-soft">
          <h2 className="font-display font-700 text-coffee text-xl">Where &amp; when</h2>
          <div className="mt-5 grid gap-5">
            <div>
              <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
                {mode === "eat-in" ? "Eating at" : "Pick up from"}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <button
                    type="button"
                    key={loc.id}
                    onClick={() => setPickupLocation(loc.id)}
                    aria-pressed={pickupLocation === loc.id}
                    className={`inline-flex items-center justify-center min-h-11 rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
                      pickupLocation === loc.id
                        ? "bg-brick text-cream shadow-chip"
                        : "bg-cream text-coffee hover:bg-saffron/40"
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
            {mode === "eat-in" && (
              <>
                <div>
                  <label htmlFor="table" className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
                    Table number
                  </label>
                  <input
                    id="table"
                    type="number"
                    min={1}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 12"
                    className="mt-2 w-full max-w-[14rem] rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1.1rem] tabular-nums text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
                    required
                  />
                </div>
                <div>
                  <span className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
                    Zone
                  </span>
                  <div className="mt-2 inline-flex rounded-pill bg-cream shadow-soft p-1.5 gap-1">
                    <button
                      type="button"
                      onClick={() => setTableZone("inside")}
                      aria-pressed={tableZone === "inside"}
                      className={`inline-flex items-center justify-center min-h-11 rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
                        tableZone === "inside" ? "bg-brick text-cream shadow-chip" : "text-coffee hover:bg-saffron/40"
                      }`}
                    >
                      Inside
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableZone("outside")}
                      aria-pressed={tableZone === "outside"}
                      className={`inline-flex items-center justify-center min-h-11 rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
                        tableZone === "outside" ? "bg-brick text-cream shadow-chip" : "text-coffee hover:bg-saffron/40"
                      }`}
                    >
                      Outside
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <label htmlFor="time" className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
                {mode === "eat-in" ? "Serve at" : "Pickup time"}
              </label>
              <input
                id="time"
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="mt-2 w-full max-w-[14rem] rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
                required
              />
            </div>
            <div>
              <label htmlFor="notes" className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
                Anything else?
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional — allergies, packaging notes…"
                className="mt-2 w-full rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee placeholder:text-muted focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 resize-y"
              />
            </div>
          </div>
        </section>

        {/* CUSTOMER */}
        <section className="rounded-xl bg-ivory p-6 shadow-soft">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display font-700 text-coffee text-xl">Who&rsquo;s ordering</h2>
            {!customer && (
              <Link href="/login?next=/shop/checkout" className="anchor font-display font-600 text-sm">
                Have an account? Sign in →
              </Link>
            )}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={name} onChange={setName} required />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={setPhone} type="tel" required />
            </Field>
          </div>
          <Field label="Email" className="mt-5">
            <Input value={email} onChange={setEmail} type="email" required />
          </Field>
        </section>

        {/* LOYALTY (if signed in) */}
        {customer && (
          <section className="rounded-xl bg-saffron/30 p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="min-w-0">
                <p className="font-display font-700 text-coffee text-lg">
                  Loyalty: {customer.points} pts
                </p>
                <p className="font-sans text-sm text-coffee/80 mt-1">
                  100 points = £5 off. You&rsquo;ll earn{" "}
                  <strong className="font-700">{earnedPoints} more</strong> on this order.
                </p>
              </div>
              {canRedeem && (
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="h-5 w-5 rounded border-2 border-hairline accent-brick"
                  />
                  <span className="font-display font-700 text-coffee">
                    Redeem 100 pts (− £5)
                  </span>
                </label>
              )}
            </div>
          </section>
        )}
      </div>

      {/* CART SUMMARY */}
      <aside>
        <div className="rounded-xl bg-ivory shadow-soft sticky top-[88px] overflow-hidden">
          <div className="p-5 border-b border-hairline">
            <p className="font-display font-700 text-coffee text-lg">Order summary</p>
          </div>
          <ul className="divide-y divide-hairline max-h-[36vh] overflow-y-auto">
            {cart.map((l) => (
              <li key={l.itemId} className="px-5 py-3 flex items-baseline justify-between gap-3">
                <span className="font-sans text-sm text-coffee truncate">
                  {l.quantity} × {l.name}
                </span>
                <span className="font-display font-600 tabular-nums text-coffee whitespace-nowrap">
                  {formatGBP((l.unitPricePence - l.discountPence) * l.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="p-5 space-y-2 border-t border-hairline">
            <Row label="Subtotal" value={formatGBP(subtotal)} />
            {lineDiscounts > 0 && (
              <Row label="Promo discount" value={`− ${formatGBP(lineDiscounts)}`} accent="text-brick" />
            )}
            {loyaltyDiscount > 0 && (
              <Row label="Loyalty reward" value={`− ${formatGBP(loyaltyDiscount)}`} accent="text-brick" />
            )}
            <div className="border-t border-hairline pt-3 flex items-baseline justify-between">
              <span className="font-display font-700 text-coffee">Total</span>
              <span className="font-display font-700 text-coffee text-2xl tabular-nums">
                {formatGBP(total)}
              </span>
            </div>
            <p className="font-sans text-xs text-coffee/70 mt-2">
              Pay when you collect. No card details taken online.
            </p>
          </div>
          <div className="p-5 pt-0">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn-primary w-full disabled:opacity-50"
            >
              <span>{status === "submitting" ? "Sending…" : "Place order"}</span>
            </button>
            {error && (
              <p className="mt-3 font-sans text-sm text-brick">{error}</p>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Input({
  value, onChange, type = "text", required,
}: {
  value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
    />
  );
}
function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-sans text-sm text-coffee/80">{label}</span>
      <span className={`font-display font-600 text-coffee tabular-nums ${accent ?? ""}`}>{value}</span>
    </div>
  );
}
