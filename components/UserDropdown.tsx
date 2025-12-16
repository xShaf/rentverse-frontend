'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { User, Settings, Home, Heart, Search, LogOut, Calendar, Shield, ClipboardList, Lock, LogIn, UserPlus, X } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useCurrentUser from '@/hooks/useCurrentUser'

interface UserDropdownProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

function UserDropdown({ isOpen, onClose, className }: Readonly<UserDropdownProps>): React.ReactNode {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useCurrentUser()
  const { logout } = useAuthStore()

  // Generate initials
  const getInitials = (firstName: string, lastName: string): string => {
    if (!user) return 'G' // Guest
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    if (firstInitial && lastInitial) return firstInitial + lastInitial
    return user.email?.charAt(0)?.toUpperCase() || 'U'
  }

  // Get full name
  const getFullName = (): string => {
    if (!user) return 'Guest'
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    return user.name || user.firstName || 'User'
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleLogout = () => {
    logout()
    onClose()
    window.location.href = '/'
  }

  if (!isOpen) return null

  const fullName = getFullName()
  const initials = getInitials(user?.firstName || '', user?.lastName || '')

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        ref={dropdownRef}
        className={clsx([
          // Base Styles (Shared)
          'bg-white z-50',
          
          // Mobile Styles (Offcanvas)
          'fixed bottom-0 left-0 right-0 w-full rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)]',
          'animate-in slide-in-from-bottom duration-300 pb-safe',
          
          // Desktop Styles (Dropdown Override)
          // We use md: to override all the fixed positioning properties
          'md:absolute md:inset-auto md:right-0 md:top-full md:mt-2',
          'md:w-72 md:rounded-lg md:shadow-lg md:border md:border-slate-200',
          'md:animate-none', // Disable mobile animation on desktop
          
          className
        ])}
      >
        {/* Mobile Drag Handle / Close */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              "w-12 h-12 rounded-full font-semibold flex items-center justify-center text-lg",
              user ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {user ? initials : <User size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-600 mb-0.5">
                {user ? 'Welcome,' : 'Hello,'}
              </p>
              <p className="text-lg font-bold text-slate-900 truncate">
                {fullName}
              </p>
              {user && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 md:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          
          {/* Guest Actions */}
          {!user && (
            <div className="px-4 py-2 space-y-2">
              <Link
                href="/auth"
                onClick={onClose}
                className="flex items-center justify-center w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <LogIn size={18} className="mr-2" />
                Sign Up
              </Link>
              <div className="border-t border-slate-100 my-4"></div>
            </div>
          )}

          {/* Customer Mode */}
          <div className="px-5 py-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explore</p>
          </div>
          
          <Link href="/property" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
            <Search size={20} className="mr-3 text-slate-400" />
            <span className="font-medium">Search Property</span>
          </Link>
          
          {user && (
            <>
              <Link href="/rents" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
                <Calendar size={20} className="mr-3 text-slate-400" />
                <span className="font-medium">My Rents</span>
              </Link>
              <Link href="/wishlist" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
                <Heart size={20} className="mr-3 text-slate-400" />
                <span className="font-medium">My Wishlist</span>
              </Link>
            </>
          )}

          {/* Seller / Admin Sections */}
          {user && (
            <>
              <div className="border-t border-slate-100 my-2"></div>
              <div className="px-5 py-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Management</p>
              </div>
              <Link href="/property/all" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
                <Home size={20} className="mr-3 text-slate-400" />
                <span className="font-medium">My Listings</span>
              </Link>
              {(user.role === 'USER' || user.role === 'ADMIN') && (
                <Link href="/manage/bookings" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
                  <ClipboardList size={20} className="mr-3 text-slate-400" />
                  <span className="font-medium">Manage Bookings</span>
                </Link>
              )}
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div className="border-t border-slate-100 my-2"></div>
              <div className="px-5 py-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin</p>
              </div>
              <Link href="/admin" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
                <Shield size={20} className="mr-3 text-slate-400" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link href="/admin/activity" onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
                <Lock size={20} className="mr-3 text-slate-400" />
                <span className="font-medium">Security Command</span>
              </Link>
            </>
          )}

          <div className="border-t border-slate-100 my-2"></div>

          {/* Settings */}
          <Link href={user ? "/account" : "/settings"} onClick={onClose} className="flex items-center px-5 py-3 text-slate-700 hover:bg-slate-50">
            <Settings size={20} className="mr-3 text-slate-400" />
            <span className="font-medium">Account</span>
          </Link>

          {/* Logout */}
          {user && (
            <button onClick={handleLogout} className="flex items-center w-full px-5 py-3 text-red-600 hover:bg-red-50">
              <LogOut size={20} className="mr-3 text-red-500" />
              <span className="font-medium">Log out</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default UserDropdown