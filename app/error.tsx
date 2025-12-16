'use client'

import { useEffect } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ContentWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Something went wrong
        </h2>
        <p className="text-slate-500 max-w-md mb-8">
          We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
        </p>

        <button
          onClick={() => reset()}
          className="flex items-center space-x-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
        >
          <RefreshCw size={18} />
          <span>Try again</span>
        </button>
      </div>
    </ContentWrapper>
  )
}