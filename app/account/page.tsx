'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import ContentWrapper from '@/components/ContentWrapper'
import { Shield, User, LogOut, ChevronRight } from 'lucide-react'

export default function AccountPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!user) return null

  return (
    <ContentWrapper>
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Account</h1>
        <p className="text-slate-500 mb-8">{user.name} • {user.email}</p>

        <div className="space-y-4">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 flex items-center gap-2">
                <User size={18} /> Profile Settings
            </div>
            <div className="p-4">
                <div className="flex justify-between py-3 border-b border-slate-50">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex justify-between py-3">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-900">{user.phone || 'Not set'}</span>
                </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-semibold text-slate-900 flex items-center gap-2">
                <Shield size={18} /> Security
            </div>
            
            {/* Link to 2FA Page */}
            <Link href="/account/2fa" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div>
                    <div className="font-medium text-slate-900">Two-Factor Authentication</div>
                    <div className="text-sm text-slate-500">
                        {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600" />
            </Link>
          </div>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 font-medium p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </div>
    </ContentWrapper>
  )
}