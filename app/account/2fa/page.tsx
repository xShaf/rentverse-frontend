'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import ButtonFilled from '@/components/ButtonFilled'
import ContentWrapper from '@/components/ContentWrapper'
import BoxError from '@/components/BoxError'
import { ArrowLeft } from 'lucide-react'

export default function TwoFactorAuthPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // optional guard logic
  }, [user])

  const handleGenerateSecret = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      })
      const result = await res.json()
      if (result.success) {
        setSecret(result.data.secret)
        setQrCode(result.data.qrCode)
      } else {
        setError(result.message || 'Failed to generate secret')
      }
    } catch (err) {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}` 
        },
        body: JSON.stringify({ token: otp }),
      })
      const result = await res.json()
      
      if (result.success || res.ok) {
        setSuccessMsg('✅ 2FA has been successfully enabled!')
        setQrCode(null)
        setSecret(null)
        if (user) {
            useAuthStore.setState({ user: { ...user, twoFactorEnabled: true } })
        }
      } else {
        setError(result.message || 'Invalid OTP Code')
      }
    } catch (err) {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <ContentWrapper>
      <div className="max-w-md mx-auto py-6 sm:py-10 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-slate-700">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
            </div>
            <p className="text-sm text-slate-500">
                {user.twoFactorEnabled 
                    ? 'Your account is secure. You will be asked for a code when logging in from a new device.'
                    : 'Add an extra layer of security to your account by requiring a code when logging in.'}
            </p>
        </div>

        {/* Setup Flow */}
        {!user.twoFactorEnabled && !successMsg && (
            <div className="space-y-6">
                {!qrCode ? (
                    <ButtonFilled onClick={handleGenerateSecret} disabled={loading}>
                        {loading ? 'Generating...' : 'Setup 2FA'}
                    </ButtonFilled>
                ) : (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="font-semibold text-center mb-4">Scan QR Code</h3>
                        
                        {/* QR Code Image */}
                        <div className="flex justify-center mb-6">
                            <div className="p-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <Image src={qrCode} alt="2FA QR Code" width={180} height={180} className="rounded-lg w-40 h-40 sm:w-48 sm:h-48" />
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-xs text-slate-500 mb-2">Can't scan? Enter this code manually:</p>
                            <code className="bg-slate-100 px-3 py-1 rounded text-sm font-mono text-slate-800 tracking-wider break-all">
                                {secret}
                            </code>
                        </div>

                        {/* Input Field */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Enter 6-digit Code</label>
                            <div className="border border-slate-300 rounded-xl overflow-hidden">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000 000"
                                    className="w-full p-4 text-center text-lg sm:text-xl tracking-[0.5em] font-mono outline-none text-slate-900 placeholder-slate-300"
                                />
                            </div>
                        </div>

                        <ButtonFilled onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
                            {loading ? 'Verifying...' : 'Activate 2FA'}
                        </ButtonFilled>
                    </div>
                )}
            </div>
        )}

        {error && <div className="mt-6"><BoxError errorTitle="Authentication Error" errorDescription={error} /></div>}
        {successMsg && <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center font-medium">{successMsg}</div>}
      </div>
    </ContentWrapper>
  )
}