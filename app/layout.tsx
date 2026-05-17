import type { Metadata } from "next";
import { Poppins, Playfair_Display, Libre_Caslon_Display, Jersey_25 } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopLoader } from "@/components/top-loader";
import { cn } from "@/lib/utils";

const fontSans = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontHeading = Libre_Caslon_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-heading",
});

const fontJersey = Jersey_25({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-jersey",
});

export const metadata: Metadata = {
  title: {
    default: "LowHat",
    template: "%s | LowHat",
  },
  description:
    "LowHat is the execution marketplace where clients and freelancers collaborate on projects with transparent governance and real-time communication.",
  keywords: [
    "LowHat",
    "execution marketplace",
    "freelance",
    "collaboration",
    "project management",
    "governance",
    "freelancer platform",
  ],
  authors: [{ name: "LowHat" }],
  creator: "LowHat",
  publisher: "LowHat",
  metadataBase: new URL("https://lowhat.com"),
  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#333333",
      },
    ],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lowhat.com",
    siteName: "LowHat",
    title: "LowHat",
    description:
      "LowHat is the execution marketplace where clients and freelancers collaborate on projects with transparent governance and real-time communication.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LowHat",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "LowHat",
    description:
      "LowHat is the execution marketplace where clients and freelancers collaborate on projects with transparent governance and real-time communication.",
    images: [
      {
        url: "/twitter-image.png",
        width: 1200,
        height: 600,
        alt: "LowHat",
      },
    ],
    creator: "@lowhat",
    site: "@lowhat",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  applicationName: "LowHat",
  appleWebApp: {
    capable: true,
    title: "LowHat",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#333333",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontSerif.variable, fontHeading.variable, fontJersey.variable, "font-sans")}
    >
      <body className="bg-background text-foreground min-h-screen selection:bg-primary/20">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
