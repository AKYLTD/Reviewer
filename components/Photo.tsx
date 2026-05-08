"use client";

import Image from "next/image";
import { useState } from "react";
import { mockupUrl, type Mockup } from "@/lib/mockups";

interface PhotoProps {
  src?: string;
  mock?: Mockup;
  alt: string;
  width?: number;
  height?: number;
  aspect?: string;
  caption?: string;
  priority?: boolean;
  className?: string;
  tone?: "saffron" | "brick" | "coffee" | "cream";
  rounded?: "sm" | "md" | "lg" | "xl";
  brandWash?: "warm" | "none";
}

const TONES: Record<NonNullable<PhotoProps["tone"]>, string> = {
  saffron: "from-saffron to-[#E2861E] text-coffee",
  brick: "from-brick to-brickDark text-cream",
  coffee: "from-coffee to-[#1F0F03] text-cream",
  cream: "from-bone to-cream text-coffee",
};

const RADIUS: Record<NonNullable<PhotoProps["rounded"]>, string> = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-[2.5rem]",
};

export function Photo({
  src,
  mock,
  alt,
  width = 1600,
  height = 1067,
  aspect = "3 / 2",
  caption,
  priority = false,
  className = "",
  tone = "saffron",
  rounded = "lg",
  brandWash = "warm",
}: PhotoProps) {
  const resolved = src ?? (mock ? mockupUrl(mock) : undefined);
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(resolved) && !errored;
  const showWash = brandWash === "warm" && showImage;

  return (
    <figure className={className}>
      <div
        className={`relative w-full overflow-hidden ${RADIUS[rounded]} shadow-soft bg-bone`}
        style={{ aspectRatio: aspect }}
      >
        {showImage ? (
          <Image
            src={resolved!}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            unoptimized={resolved!.startsWith("https://")}
            onError={() => setErrored(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderPlate label={alt} tone={tone} />
        )}

        {showWash && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-multiply"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245, 166, 35, 0.18) 0%, rgba(201, 72, 58, 0.18) 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-overlay"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 35%, rgba(255, 246, 224, 0.18) 0%, rgba(74, 31, 8, 0.22) 100%)",
              }}
            />
          </>
        )}
      </div>
      {caption && (
        <figcaption className="label-muted mt-3">{caption}</figcaption>
      )}
    </figure>
  );
}

function PlaceholderPlate({
  label,
  tone,
}: {
  label: string;
  tone: NonNullable<PhotoProps["tone"]>;
}) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${TONES[tone]} flex items-end p-6`}>
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.18) 100%)",
        }}
      />
      <div className="relative flex w-full items-end justify-between gap-6">
        <span className="font-sans text-[0.7rem] font-600 uppercase tracking-wide opacity-90">
          {label}
        </span>
      </div>
    </div>
  );
}
