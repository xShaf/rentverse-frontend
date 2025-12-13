'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import React, { ChangeEvent, useState } from 'react'
import { ArrowLeft, Smartphone } from 'lucide-react'
import BoxError from '@/components/BoxError'
import InputPassword from '@/components/InputPassword'
import ButtonFilled from '@/components/ButtonFilled'
import useAuthStore from '@/stores/authStore'

interface ModalLogInProps {
  isModal?: boolean
}

function ModalLogIn({ isModal = true }: ModalLogInProps) {
  const {
    password,
    isLoading,
    error,
    setPassword,
    isLoginFormValid,
    submitLogIn,
    submitOtp,
    setError, // Need this to clear errors on mode switch
  } = useAuthStore()
  
  const router = useRouter()

  // ✅ MFA Local State
  const [showMFAInput, setShowMFAInput] = useState(false)
  const [mfaToken, setMfaToken] = useState('')

  const handleBackButton = () => {
    if (showMFAInput) {
      setShowMFAInput(false)
      setError(null)
      setMfaToken('')
    } else {
      router.back()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ 1. Submit OTP if in MFA Mode
    if (showMFAInput) {
      await submitOtp(mfaToken)
      return
    }

    // ✅ 2. Normal Login Attempt
    const result = await submitLogIn()
    
    // ✅ 3. Check if Backend asks for MFA
    if (result && result.requireMFA) {
      setShowMFAInput(true)
      setError(null) // Clear any "invalid password" errors if they appeared
    }
  }

  const containerContent = (
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      {/* Header */}
      <div className="text-center mb-6 relative">
        <ArrowLeft onClick={handleBackButton} size={20}
                   className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          {showMFAInput ? 'Two-Factor Authentication' : 'Log in'}
        </h2>
        <div className="w-full h-px bg-slate-200 mt-4"></div>
      </div>

      {/* Content */}
      <div className="mb-8">
        {/* Alert box - only show when there's an error */}
        {error && (
          <div className="mb-6">
            <BoxError errorTitle={'Authentication Failed'} errorDescription={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ✅ CONDITIONAL RENDERING: Password vs MFA */}
          {!showMFAInput ? (
            /* --- PASSWORD STEP --- */
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-3">
                Password
              </label>
              <InputPassword
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Password"
                required
                showStrengthIndicator={false}
              />
            </div>
          ) : (
            /* --- MFA STEP --- */
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <label htmlFor="mfa" className="block text-sm font-medium text-slate-900 mb-3">
                Authenticator Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="mfa"
                  type="text"
                  maxLength={6}
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))} // Numbers only
                  placeholder="000000"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm tracking-[0.25em] font-mono text-center text-lg"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 text-center">
                Enter the 6-digit code from your Google Authenticator app.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <ButtonFilled
            type="submit"
            disabled={(showMFAInput ? mfaToken.length < 6 : !isLoginFormValid()) || isLoading}
          >
            {isLoading ? 'Verifying...' : showMFAInput ? 'Verify & Login' : 'Log in'}
          </ButtonFilled>

          {!showMFAInput && (
            <div className="text-center">
              <Link href={'/'} className={'underline text-slate-700 text-sm hover:text-slate-900 transition-colors'}>
                Forgot password?
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        {containerContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      {containerContent}
    </div>
  )
}

export default ModalLogIn