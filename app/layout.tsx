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

export const metadata = {
  title: "LowHat",
  description: "The execution marketplace.",
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
