import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible,
  IBM_Plex_Mono,
  Shrikhand,
} from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import StorageNotice from "@/components/StorageNotice";
import "./globals.css";

/**
 * Fonts are bundled at build time, so no page asks another host for anything
 * while a learner is using it.
 */
const shrikhand = Shrikhand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shrikhand",
});

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-atkinson",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Prompt Magic",
    template: "%s · Prompt Magic",
  },
  description:
    "Learn to talk to AI in a kitchen. Write clear orders, work your way up from Prep Cook to Head Chef, and keep your kitchen safe. Free, no sign-up.",
  applicationName: "Prompt Magic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${shrikhand.variable} ${atkinson.variable} ${plexMono.variable}`}
    >
      <body>
        <a className="skip btn" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <StorageNotice />
        <main id="main" tabIndex={-1}>
          <div className="wrap">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
