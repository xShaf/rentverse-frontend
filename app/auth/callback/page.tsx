'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import ContentWrapper from '@/components/ContentWrapper'
import { setCookie } from '@/utils/cookies'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { validateToken } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token')
      const provider = searchParams.get('provider')

      if (!token) {
        console.error('No token found in callback URL')
        router.push('/auth?error=no_token')
        return
      }

      if (provider && !['google', 'facebook', 'github', 'twitter', 'apple'].includes(provider)) {
        console.error('Invalid provider:', provider)
        router.push('/auth?error=invalid_provider')
        return
      }

      try {
        // Store the token in localStorage and cookies
        localStorage.setItem('authToken', token)
        setCookie('authToken', token, 7) // 7 days expiry

        // Validate the token and fetch user data
        const isValid = await validateToken()
        
        if (isValid) {
          // Check for 'isNewUser' flag passed from backend for social logins
          const isNewUser = searchParams.get('isNewUser') === 'true'
          
          if (isNewUser) {
             router.push('/auth/complete-profile')
          } else {
             router.push('/')
          }
        } else {
          // Token validation failed
          localStorage.removeItem('authToken')
          router.push('/auth?error=invalid_token')
        }
      } catch (error) {
        console.error('Error processing auth callback:', error)
        localStorage.removeItem('authToken')
        router.push('/auth?error=auth_failed')
      }
    }

    handleAuthCallback()
  }, [searchParams, router, validateToken])

  return (
    <ContentWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-teal-600 mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Completing sign in...
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xs mx-auto">
              Please wait while we verify your authentication details.
            </p>
          </div>
        </div>
      </div>
    </ContentWrapper>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <ContentWrapper>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto"></div>
            <h2 className="text-lg font-medium text-slate-900">Loading...</h2>
          </div>
        </div>
      </ContentWrapper>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}