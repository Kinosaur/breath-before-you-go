import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  themeColor: "#0a0a0a",
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
          font-sans antialiased
          bg-[#0a0a0a] text-[#f5f5f5]
          min-h-screen
        `}
      >
        {children}
      </body>
    </html>
  );
}
