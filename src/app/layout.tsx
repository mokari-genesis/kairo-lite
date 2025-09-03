import './globals.css'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <title>Kairo Lite</title>
        <meta name='description' content='Kairo Lite' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
