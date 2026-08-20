import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({ 
  subsets: ["latin"], 
  variable: "--font-geist-sans", 
  display: 'swap' 
});
const geistMono = Geist_Mono({ 
  subsets: ["latin"], 
  variable: "--font-geist-mono", 
  display: 'swap' 
});

export const metadata: Metadata = {
  title: 'MetaGen — AI-Powered YouTube Metadata Generator',
  description: 'Transform your video scripts into SEO-optimized titles, descriptions, and tags with our elite AI model.',
  generator: 'MetaGen AI',
  icons: {
    icon: [
      {
        url: '/logos/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/logos/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght@300;400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="relative min-h-screen flex flex-col">
            {children}
          </div>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
