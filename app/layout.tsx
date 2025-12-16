import React from 'react'
import type { Metadata } from 'next'
import { Poly, Manrope } from 'next/font/google'
import './globals.css'
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/scrollbar'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import clsx from 'clsx'
import AuthInitializer from '@/components/AuthInitializer'

const poly = Poly({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-poly',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Rentverse',
  description: 'Your rental platform for apartments, houses, and more.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx([poly.className, manrope.className])}>
      <body className="antialiased min-h-screen flex flex-col bg-white">
        <AuthInitializer />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}