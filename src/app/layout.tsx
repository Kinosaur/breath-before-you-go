import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { CornerActions } from "@/components/ui/CornerActions";
import { SmartCursor } from "@/components/ui/SmartCursor";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:  "Breathe Before You Go",
    template: "%s · Breathe Before You Go",
  },
  description:
    "When and where is it safe to breathe? Interactive air quality intelligence for 15 Asian cities — seasonal calendars, health metrics, and safe exercise windows.",
  keywords: [
    "air quality", "Asia", "PM2.5", "AQI", "travel planning",
    "health", "pollution", "OpenAQ", "breathing", "air pollution map",
  ],
  authors: [{ name: "Kino" }],
  openGraph: {
    title:       "Breathe Before You Go",
    description: "When and where is it safe to breathe?",
    type:        "website",
    locale:      "en_US",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Breathe Before You Go",
    description: "When and where is it safe to breathe?",
  },
};

export const viewport: Viewport = {
  themeColor: "#080B12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          ${instrumentSans.variable} ${newsreader.variable}
          font-sans antialiased
          bg-[#080B12] text-[#f5f5f5]
          min-h-screen
        `}
      >
        <CornerActions githubHref={process.env.NEXT_PUBLIC_GITHUB_REPO_URL} />
        <SmartCursor />
        {children}
      </body>
    </html>
  );
}
