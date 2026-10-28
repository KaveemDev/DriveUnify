import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://driveunify.com"),
  title: {
    default: "DriveUnify, Cobalt — All your Drives, one place",
    template: "%s | DriveUnify",
  },
  description:
    "Browse, search and copy files across work, personal and school Drives without signing out once.",
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
    title: "DriveUnify — All your Drives, one place",
    description:
      "Browse, search and copy files across work, personal and school Drives without signing out once.",
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
    title: "DriveUnify — All your Drives, one place",
    description:
      "Browse, search and copy files across work, personal and school Drives without signing out once.",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('du-theme');
                if (saved) {
                  document.documentElement.dataset.theme = saved;
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
