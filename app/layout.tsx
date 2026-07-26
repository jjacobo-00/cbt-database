import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import NextTopLoader from "nextjs-toploader";

import { Toaster } from "@/components/ui/toaster";
import { ScrollToTop } from "@/components/ScrollToTop";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CBT-database",
  description: "Manage church members, ministries, and reports efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="#2563eb" showSpinner={false} />
          {children}
          <Toaster />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
