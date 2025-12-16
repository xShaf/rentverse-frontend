import Link from 'next/link'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <ContentWrapper>
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
        {/* 404 Illustration */}
        <div className="relative w-64 h-48 sm:w-80 sm:h-64 mb-8 opacity-90">
          <Image
            src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758310328/rentverse-base/image_17_hsznyz.png" 
            alt="Page not found"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Page not found
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-md mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
          >
            <Home size={18} />
            <span>Go Home</span>
          </Link>
          <Link
            href="/property"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            <Search size={18} />
            <span>Search</span>
          </Link>
        </div>
      </div>
    </ContentWrapper>
  )
}