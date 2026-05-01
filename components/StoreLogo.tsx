"use client";

import { useState } from "react";

const PALETTE = [
  ["#1f2e89", "#3d68ff"],
  ["#0f766e", "#10b981"],
  ["#7c2d12", "#f97316"],
  ["#581c87", "#a855f7"],
  ["#831843", "#ec4899"],
  ["#0c4a6e", "#0ea5e9"],
  ["#365314", "#84cc16"],
  ["#7c1d1d", "#ef4444"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function StoreLogo({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const palette = PALETTE[hash(name) % PALETTE.length];
  const showPhoto = src && !failed;
  return (
    <span
      className="relative inline-flex flex-none items-center justify-center overflow-hidden rounded-xl text-xs font-semibold text-white shadow-card"
      style={{
        width: size,
        height: size,
        background: showPhoto ? "#000" : `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
      }}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <span style={{ fontSize: size * 0.36 }}>{initials(name)}</span>
      )}
    </span>
  );
}
