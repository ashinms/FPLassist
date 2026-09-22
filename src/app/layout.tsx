import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPLassist",
  description: "Three AI agents debate your next FPL transfer using live data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full flex flex-col bg-zinc-950 bg-fixed"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--pl-purple) 45%, transparent), transparent)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
