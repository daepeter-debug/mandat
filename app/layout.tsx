import type { Metadata } from "next";
import "./globals.css";
import "./magazine.css";
import "./news.css";


const description = "Nezávislý prehľad volebných prieskumov a politických strán. Overiteľné zdroje, zrozumiteľné súvislosti.";

export const metadata: Metadata = {
  title: "Mandát — Slovensko v číslach",
  description,
  applicationName: "Mandát",
  manifest: "/manifest.webmanifest",
  openGraph: { title: "Mandát — Slovensko v číslach", description, type: "website", locale: "sk_SK", siteName: "Mandát" },
  twitter: { card: "summary", title: "Mandát — Slovensko v číslach", description },
  other: { "theme-color": "#f4f6f0" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className="antialiased">{children}</body>
    </html>
  );
}

