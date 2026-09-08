import "./global.css";
import {Nunito, Bungee} from "next/font/google";
import type { Metadata } from 'next'
import React from "react";

const description =
  "Gain actionable insights to effortlessly manage poster campaigns. Generate flyers, and track exactly when/where they are interacted with.";

export const metadata : Metadata = {
  metadataBase: new URL("https://www.postertrace.app"),
  title: {
    default: "PosterTrace",
    template: "%s · PosterTrace",
  },
  description,
  applicationName: "PosterTrace",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "PosterTrace",
    url: "/",
    title: "PosterTrace",
    description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "PosterTrace",
    description,
  },
};

const bungee = Bungee({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bungee',
  fallback: ['sans-serif'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  fallback: ['sans-serif'],
});

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children } : RootLayoutProps) {
  return (
    <html lang="en-GB" className={`${bungee.variable} ${nunito.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
