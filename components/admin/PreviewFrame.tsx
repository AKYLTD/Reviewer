"use client";

import { useState } from "react";

interface ViewportPreset {
  label: string;
  width: number;
  height: number;
}

const PRESETS: ViewportPreset[] = [
  { label: "iPhone 15",   width: 393,  height: 852 },
  { label: "iPhone SE",   width: 375,  height: 667 },
  { label: "Android",     width: 412,  height: 915 },
  { label: "iPad mini",   width: 744,  height: 1133 },
  { label: "iPad Pro",    width: 1024, height: 1366 },
  { label: "Desktop",     width: 1440, height: 900 },
];

const ROUTES = [
  { href: "/",                label: "Home" },
  { href: "/shop",            label: "Shop" },
  { href: "/menu",            label: "Menu" },
  { href: "/cakes/order",     label: "Cake builder" },
  { href: "/catering",        label: "Catering" },
  { href: "/visit",           label: "Visit" },
  { href: "/account",         label: "Account" },
  { href: "/signup",          label: "Signup" },
  { href: "/login",           label: "Login" },
];

/**
 * Embeds the public site inside a sized iframe so the admin can see
 * exactly how a page renders at each viewport. Width can be 320–1440;
 * the iframe scales down with the device-pixel ratio if the chosen
 * width exceeds the viewer's column.
 */
export function PreviewFrame() {
  const [preset, setPreset] = useState<ViewportPreset>(PRESETS[0]);
  const [route, setRoute] = useState<string>("/");
  const [rotated, setRotated] = useState(false);

  const w = rotated ? preset.height : preset.width;
  const h = rotated ? preset.width : preset.height;

  return (
    <div className="space-y-5">
      {/* CONTROLS */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-pill bg-ivory shadow-soft p-1.5 gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPreset(p)}
              aria-pressed={preset.label === p.label}
              className={`inline-flex items-center justify-center min-h-9 rounded-pill px-3 py-1 font-display font-600 text-xs transition ${
                preset.label === p.label
                  ? "bg-brick text-cream shadow-chip"
                  : "text-coffee hover:bg-saffron/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRotated((r) => !r)}
          className="btn-ghost text-xs px-4 py-2"
          aria-pressed={rotated}
        >
          {rotated ? "Portrait" : "Landscape"}
        </button>
        <select
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="rounded-md bg-ivory border border-hairline px-4 py-2 font-display font-600 text-sm text-coffee min-h-9"
          aria-label="Page to preview"
        >
          {ROUTES.map((r) => (
            <option key={r.href} value={r.href}>{r.label} — {r.href}</option>
          ))}
        </select>
        <span className="font-sans text-xs font-600 tabular-nums text-coffee/70 ml-auto">
          {w} × {h}
        </span>
      </div>

      {/* DEVICE FRAME */}
      <div className="flex justify-center">
        <div
          className="relative bg-coffee/10 rounded-[2rem] p-3 shadow-pop overflow-hidden"
          style={{ width: w + 24, maxWidth: "100%" }}
        >
          <div
            className="bg-cream rounded-[1.5rem] overflow-hidden mx-auto"
            style={{ width: w, height: h, maxWidth: "100%" }}
          >
            <iframe
              key={`${route}-${w}-${h}`}
              src={route}
              title={`Preview ${route}`}
              className="w-full h-full border-0 bg-cream"
              loading="eager"
            />
          </div>
        </div>
      </div>

      <p className="font-sans text-xs text-coffee/70 text-center max-w-2xl mx-auto">
        The frame uses the same code as production; you&rsquo;re seeing
        the live page rendered at the chosen viewport. Cookies / login
        state are shared with this admin session, so authenticated views
        render as if you were the customer.
      </p>
    </div>
  );
}
