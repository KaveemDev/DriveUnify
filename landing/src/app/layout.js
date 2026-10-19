import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://driveunify.com"),
  title: {
    default: "DriveUnify — Your Cloud Storage, Unified",
    template: "%s | DriveUnify",
  },
  description:
    "Connect multiple Google Drive accounts and seamlessly access, search, and manage all your files from one unified, lightning-fast dashboard.",
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
    title: "DriveUnify — Your Cloud Storage, Unified",
    description:
      "Connect multiple Google Drive accounts and seamlessly access, search, and manage all your files from one unified, lightning-fast dashboard.",
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
    title: "DriveUnify — Your Cloud Storage, Unified",
    description:
      "Connect multiple Google Drive accounts and manage all your files in one place.",
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
    <html lang="en" className={`${inter.variable} h-full antialiased dark`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
