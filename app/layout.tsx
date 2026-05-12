import type { Metadata, Viewport } from "next";
import { Fredoka, DM_Sans } from "next/font/google";
import "./globals.css";

// Display — rounded friendly sans, closest free analogue to the "Fresh
// Catering" wordmark from the user's brand reference.
const display = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Body — DM Sans is warmer than Inter and pairs cleanly with Fredoka.
const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ronisonline.com"),
  title: {
    default: "Roni's · Bagel Bakery",
    template: "%s · Roni's Bagel Bakery",
  },
  description:
    "Roni's Bagel Bakery — four shops across north London: Belsize, Swain's Lane, West Hampstead, Muswell Hill. Click & collect, dine-in, catering and cakes.",
  openGraph: {
    title: "Roni's · Bagel Bakery",
    description: "Roni's Bagel Bakery — four shops across north London.",
    type: "website",
    locale: "en_GB",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F0E4D0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
