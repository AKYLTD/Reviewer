import type { Metadata, Viewport } from "next";
import { Marcellus, EB_Garamond, Public_Sans } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

// "RONI'S" — tall, high-contrast modern serif (Didone family).
// Marcellus is the closest free Didone-flavoured serif; it ships only one
// weight, which is exactly what the masthead needs.
const display = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// "Belsize Village" — bold old-style serif, italic on the sign.
const editorial = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

// "BAGEL BAKERY & CAFÉ" / "37-39" — light geometric sans, wide tracking.
const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ronisbelsize.com"),
  title: {
    default: "Roni's · Belsize Village",
    template: "%s · Roni's Belsize Village",
  },
  description:
    "Bagel bakery and café at 37–39 Belsize Lane, London NW3. Click & collect, dine-in ordering, catering and cakes.",
  openGraph: {
    title: "Roni's · Belsize Village",
    description:
      "Bagel bakery and café at 37–39 Belsize Lane, London NW3.",
    type: "website",
    locale: "en_GB",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${editorial.variable} ${sans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
