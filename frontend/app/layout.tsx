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
