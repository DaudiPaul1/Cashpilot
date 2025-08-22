import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Providers from './providers';
import { NotificationContainer } from '@/components/ui/Notification';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CashPilot - AI-Powered Financial Dashboard",
  description: "Connect your accounts, get AI insights, and track your finances with CashPilot's intelligent financial dashboard for small businesses.",
  keywords: ["financial dashboard", "AI insights", "cash flow", "small business", "accounting", "financial management"],
  authors: [{ name: "CashPilot Team" }],
  creator: "CashPilot",
  publisher: "CashPilot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "CashPilot - AI-Powered Financial Dashboard",
    description: "Connect your accounts, get AI insights, and track your finances with CashPilot's intelligent financial dashboard.",
    url: "/",
    siteName: "CashPilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CashPilot Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CashPilot - AI-Powered Financial Dashboard",
    description: "Connect your accounts, get AI insights, and track your finances with CashPilot's intelligent financial dashboard.",
    images: ["/og-image.png"],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3B82F6" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CashPilot",
              "description": "AI-powered financial dashboard for small businesses",
              "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "CashPilot"
              }
            })
          }}
        />
      </head>
      <body className="antialiased bg-gray-50">
        <ErrorBoundary>
          <Providers>
            {children}
            <NotificationContainer />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
