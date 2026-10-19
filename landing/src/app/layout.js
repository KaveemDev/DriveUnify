import localFont from "next/font/local";
import "./globals.css";

// Satoshi by Indian Type Foundry, self-hosted from Fontshare (free licence, commercial use allowed).
const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-400.woff2", weight: "400" },
    { path: "./fonts/Satoshi-500.woff2", weight: "500" },
    { path: "./fonts/Satoshi-700.woff2", weight: "700" },
    { path: "./fonts/Satoshi-900.woff2", weight: "900" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Runs before first paint: saved choice, else the system setting. Shared with the dashboard.
const themeScript = `(function(){try{var t=localStorage.getItem("themeMode");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export const metadata = {
  metadataBase: new URL("https://driveunify.com"),
  title: {
    default: "DriveUnify: All your Google Drives in one place",
    template: "%s | DriveUnify",
  },
  description:
    "Browse, search and copy files across your work, personal and school Google Drives without signing out once.",
  keywords: [
    "Google Drive manager",
    "cloud storage unification",
    "multiple drive accounts",
    "cloud file manager",
    "DriveUnify",
    "cloud sync",
  ],
  authors: [{ name: "DriveUnify Team" }],
  creator: "DriveUnify",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://driveunify.com",
    siteName: "DriveUnify",
    title: "DriveUnify: All your Google Drives in one place",
    description:
      "Browse, search and copy files across your work, personal and school Google Drives without signing out once.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DriveUnify Dashboard & Cloud Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DriveUnify: All your Google Drives in one place",
    description:
      "Browse, search and copy files across all your Google Drives in one place.",
    creator: "@driveunify",
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-page text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
