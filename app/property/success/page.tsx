'use client'

import Link from 'next/link'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import { CheckCircle, Home, Plus } from 'lucide-react'

function SuccessPage() {
  return (
    <ContentWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
        {/* Success Icon/Image */}
        <div className="relative w-32 h-32 sm:w-48 sm:h-48 mb-8">
          <Image
            src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758310328/rentverse-base/image_17_hsznyz.png"
            alt="Success"
            fill
            className="object-contain"
          />
          <div className="absolute -bottom-2 -right-2 bg-green-100 p-3 rounded-full border-4 border-white">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
          Listing Published Successfully!
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-md mb-10 leading-relaxed">
          Your property is now live and visible to thousands of potential tenants on Rentverse.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/property/all"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            <Home size={18} />
            <span>View My Listings</span>
          </Link>
          
          <Link
            href="/property/new"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            <Plus size={18} />
            <span>List Another</span>
          </Link>
        </div>
      </div>
    </ContentWrapper>
  )
}

export default SuccessPage