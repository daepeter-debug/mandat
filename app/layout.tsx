import type { Metadata } from "next";
import "./globals.css";
import "./magazine.css";
import "./news.css";


export const metadata: Metadata = {
  title: "Mandát — Slovensko v číslach",
  description: "Nezávislý prehľad volebných prieskumov a politických strán. Overiteľné zdroje, zrozumiteľné súvislosti.",
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

