import './globals.css'
// import 'react-pdf/dist/Page/AnnotationLayer.css';
// import 'react-pdf/dist/Page/TextLayer.css';
import { Providers } from './providers'
import MainLayout from '../components/MainLayout'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tradexflooracademy.com'),
  title: {
    default: 'TradeX Floor Academy - Master The Art of Professional Trading',
    template: '%s | TradeX Floor Academy'
  },
  description: 'TradeX Floor Academy is the best Stock Market Institute that Transform Your Journey. Learn Price Action, SMC, Risk Management & Technical Analysis. 1500+ Students, 90% Success Ratio.',
  keywords: ['trading', 'stock market', 'forex', 'crypto', 'education', 'courses', 'TradeX Floor Academy', 'Price Action', 'SMC', 'Smart Money Concepts', 'Technical Analysis', 'Risk Management'],
  authors: [{ name: 'TradeX Floor Team' }],
  creator: 'TradeX Floor Academy',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tradexflooracademy.com',
    title: 'TradeX Floor Academy - Master The Art of Professional Trading',
    description: 'Join 1500+ students mastering Price Action and SMC. Best Stock Market Institute in India.',
    siteName: 'TradeX Floor Academy',
    images: [
      {
        url: '/og-image.jpg', // Ensure this exists or use a placeholder
        width: 1200,
        height: 630,
        alt: 'TradeXFloor Academy Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradeX Floor Academy - Master The Art of Professional Trading',
    description: 'Transform your trading journey with expert mentorship and proven strategies.',
    images: ['/og-image.jpg'],
    creator: '@tradexfloor',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Maintenance check
import { getSystemConfig } from '@/lib/system'
import { auth } from '@/auth'
import MaintenancePage from '@/components/MaintenancePage'

export default async function RootLayout({ children }) {
  // Check maintenance mode
  let isMaintenance = false;
  try {
    const config = await getSystemConfig();
    if (config?.maintenanceMode) {
      const session = await auth();
      // Allow admins to bypass maintenance
      if (session?.user?.role !== 'ADMIN') {
        isMaintenance = true;
      }
    }
  } catch (error) {
    console.error('Maintenance check failed:', error);
  }

  if (isMaintenance) {
    return (
      <html lang="en">
        <body className="antialiased">
          <MaintenancePage />
        </body>
      </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased">
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  )
}