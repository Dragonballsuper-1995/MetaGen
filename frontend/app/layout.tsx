import type { Metadata } from 'next'
import { Geist, Geist_Mono, Doto, Silkscreen, Space_Mono } from 'next/font/google'
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

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
  display: 'swap',
  weight: ["400", "700", "900"]
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  variable: "--font-silkscreen",
  display: 'swap',
  weight: ["400", "700"]
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: 'swap',
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: 'MetaGen // Field Synthesizer — YouTube Metadata Engine',
  description: 'Industrial-grade AI metadata synthesizer powered by high-speed inference.',
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${doto.variable} ${silkscreen.variable} ${spaceMono.variable} font-mono antialiased bg-background text-foreground overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-200`}>
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
