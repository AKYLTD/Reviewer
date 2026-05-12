"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ShopLite {
  id: string;
  name: string;
  shortName: string;
  addressLine1: string;
  addressLine2: string;
  lat?: number;
  lng?: number;
}

interface Props {
  locations: ShopLite[];
  /** Render variant: 'banner' = top-of-page strip, 'pill' = inline. */
  variant?: "banner" | "pill";
  /** Storage key so a user only sees the prompt once per session. */
  storageKey?: string;
}

/** Haversine distance in km between two lat/lng points. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const PREFERRED_KEY = "ronis-preferred-shop";

/**
 * Geolocation-based nearest-shop prompt. Uses the browser's Geolocation
 * API after the user clicks "Find my nearest shop" (we don't ask
 * permission unprompted — that's noisy). Once they confirm a shop, we
 * remember the preference in localStorage so subsequent visits skip
 * the prompt.
 *
 * Renders a dismissable banner above the page content (variant="banner")
 * or a small inline trigger (variant="pill").
 */
export function LocationFinder({ locations, variant = "banner", storageKey = "ronis-location-prompt-v1" }: Props) {
  const [status, setStatus] = useState<"idle" | "asking" | "located" | "denied" | "error" | "confirmed" | "dismissed">("idle");
  const [nearest, setNearest] = useState<{ shop: ShopLite; km: number } | null>(null);
  const [preferred, setPreferred] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PREFERRED_KEY);
      if (p) {
        setPreferred(p);
        setStatus("confirmed");
        return;
      }
      const dismissed = sessionStorage.getItem(storageKey);
      if (dismissed === "1") setStatus("dismissed");
    } catch {}
  }, [storageKey]);

  const findNearest = () => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let best: { shop: ShopLite; km: number } | null = null;
        for (const loc of locations) {
          if (typeof loc.lat !== "number" || typeof loc.lng !== "number") continue;
          const km = distanceKm(here, { lat: loc.lat, lng: loc.lng });
          if (!best || km < best.km) best = { shop: loc, km };
        }
        if (best) {
          setNearest(best);
          setStatus("located");
        } else {
          setStatus("error");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("error");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  };

  const confirmShop = (shop: ShopLite) => {
    try {
      localStorage.setItem(PREFERRED_KEY, shop.id);
    } catch {}
    setPreferred(shop.id);
    setStatus("confirmed");
  };

  const dismiss = () => {
    try { sessionStorage.setItem(storageKey, "1"); } catch {}
    setStatus("dismissed");
  };

  // Hide when dismissed
  if (status === "dismissed") return null;

  // Confirmed pill — shows the preferred shop with a "change" link.
  if (status === "confirmed" && preferred) {
    const shop = locations.find((l) => l.id === preferred);
    if (!shop) return null;
    return (
      <div className="inline-flex items-center gap-3 rounded-pill bg-saffron/40 border border-saffron px-4 py-2 font-display font-600 text-sm text-coffee">
        <span aria-hidden>📍</span>
        Your shop:{" "}
        <Link href={`/visit#${shop.id}`} className="anchor font-700">
          {shop.name}
        </Link>
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem(PREFERRED_KEY); } catch {}
            setPreferred(null);
            setStatus("idle");
          }}
          className="ml-2 font-sans text-[0.65rem] font-700 uppercase tracking-widest text-coffee/70 hover:text-coffee"
        >
          Change
        </button>
      </div>
    );
  }

  // Pill variant — small inline trigger
  if (variant === "pill" && status === "idle") {
    return (
      <button
        type="button"
        onClick={findNearest}
        className="inline-flex items-center gap-2 rounded-pill bg-ivory border border-hairline px-4 py-2 font-display font-600 text-sm text-coffee hover:bg-saffron/40 transition"
      >
        <span aria-hidden>📍</span>
        Find my nearest shop
      </button>
    );
  }

  // Banner variant
  return (
    <div className="relative overflow-hidden rounded-xl bg-saffron text-coffee shadow-soft">
      <div className="p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        {status === "idle" && (
          <>
            <div>
              <p className="font-display font-700 text-coffee text-lg">
                Find your nearest Roni&rsquo;s
              </p>
              <p className="font-sans text-sm text-coffee/80 mt-1">
                We&rsquo;ll point you to the closest of our four north-London
                shops. Your location stays in your browser.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={findNearest} className="btn-primary text-sm">
                <span>Find my shop</span>
              </button>
              <button type="button" onClick={dismiss} className="btn-ghost text-sm">
                Not now
              </button>
            </div>
          </>
        )}
        {status === "asking" && (
          <p className="font-display font-700 text-coffee">
            Asking your browser for your location…
          </p>
        )}
        {status === "located" && nearest && (
          <>
            <div>
              <p className="font-sans text-xs font-600 uppercase tracking-widest text-coffee/80">
                We think you&rsquo;re nearest
              </p>
              <p className="mt-1 font-display font-700 text-coffee text-2xl">
                {nearest.shop.name}
              </p>
              <p className="font-sans text-sm text-coffee/85 mt-1">
                {nearest.shop.addressLine1} · {nearest.km.toFixed(1)} km away
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => confirmShop(nearest.shop)}
                className="btn-primary text-sm"
              >
                <span>Yes, that&rsquo;s me</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setNearest(null);
                }}
                className="btn-ghost text-sm"
              >
                Pick another
              </button>
            </div>
          </>
        )}
        {status === "denied" && (
          <>
            <p className="font-sans text-sm text-coffee">
              No worries — we couldn&rsquo;t read your location. Pick the
              shop you&rsquo;d like in the menu.
            </p>
            <button type="button" onClick={dismiss} className="btn-ghost text-sm">
              Close
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <p className="font-sans text-sm text-coffee">
              Couldn&rsquo;t work out your nearest shop. The list lives on{" "}
              <Link href="/visit" className="anchor font-700">/visit</Link>.
            </p>
            <button type="button" onClick={dismiss} className="btn-ghost text-sm">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
