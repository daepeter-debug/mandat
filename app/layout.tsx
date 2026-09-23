import type { Metadata } from "next";
import "./globals.css";
import "./magazine.css";
import "./news.css";
import "./theme-dark.css";
import { darkThemeColor } from "@/lib/theme-colors";


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
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Mandát", statusBarStyle: "default" },
};

// Tmavý režim (voľba z prepínača) sa nastaví ešte pred prvým vykreslením, aby stránka neblikla. Výzva na inštaláciu
// (beforeinstallprompt) môže prísť skôr, než sa načíta React — odloží sa pre tlačidlo „Pridať na plochu“.
const themeScript = `try{if(localStorage.getItem("mandat-theme")==="dark"){document.documentElement.dataset.theme="dark";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${darkThemeColor}")}}catch(e){}window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__mandatInstall=e;window.dispatchEvent(new Event("mandat-install"))});`;

const fonts = ["/fonts/ibm-plex-sans-latin-wght-normal.woff2", "/fonts/ibm-plex-sans-latin-ext-wght-normal.woff2"];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }}/>
        {/* Písmo je v každom texte; React tieto prednačítania presunie do <head>. */}
        {fonts.map(file => <link key={file} rel="preload" as="font" type="font/woff2" href={file} crossOrigin="anonymous"/>)}
        {children}
      </body>
    </html>
  );
}

