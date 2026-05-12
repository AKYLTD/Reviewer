"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-black text-white px-4 py-2 text-sm font-700"
    >
      Print
    </button>
  );
}
