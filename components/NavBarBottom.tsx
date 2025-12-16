'use client'

import Link from "next/link"
import { Search, Heart, Calendar, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import useAuthStore from '@/stores/authStore'
import UserDropdown from '@/components/UserDropdown'

type NavItem = 'explore' | 'wishlists' | 'rents' | 'profile'

function NavBarBottom() {
  const { isLoggedIn, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<NavItem>('explore')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleTabClick = (tab: NavItem) => {
    setActiveTab(tab)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropdownOpen(!isDropdownOpen)
    setActiveTab('profile')
  }

  const getInitials = () => {
    if (!user) return null
    const first = user.firstName?.charAt(0) || ''
    const last = user.lastName?.charAt(0) || ''
    if (first && last) return (first + last).toUpperCase()
    return (user.name?.slice(0, 2) || user.email?.charAt(0) || 'U').toUpperCase()
  }

  return (
    <>
      <nav className={clsx([
          'fixed z-40', // Lower z-index than dropdown
          'block md:hidden',
          'bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe'
        ])}>
        <ul className="flex items-center justify-around py-2 px-2">
          {/* Explore */}
          <li>
            <Link
              href='/'
              onClick={() => handleTabClick('explore')}
              className="flex flex-col items-center space-y-1 group p-2 min-w-[64px]"
            >
              <Search
                size={24}
                className={activeTab === 'explore' ? 'text-teal-600' : 'text-slate-400'}
              />
              <span className={clsx("text-[10px] font-medium", activeTab === 'explore' ? 'text-teal-600' : 'text-slate-400')}>
                Explore
              </span>
            </Link>
          </li>

          {/* Wishlists */}
          <li>
            <Link
              href='/wishlist'
              onClick={() => handleTabClick('wishlists')}
              className="flex flex-col items-center space-y-1 group p-2 min-w-[64px]"
            >
              <Heart
                size={24}
                className={activeTab === 'wishlists' ? 'text-teal-600' : 'text-slate-400'}
              />
              <span className={clsx("text-[10px] font-medium", activeTab === 'wishlists' ? 'text-teal-600' : 'text-slate-400')}>
                Wishlists
              </span>
            </Link>
          </li>

          {/* Rents (Visible only when logged in) */}
          {isLoggedIn && (
            <li>
              <Link
                href='/rents'
                onClick={() => handleTabClick('rents')}
                className="flex flex-col items-center space-y-1 group p-2 min-w-[64px]"
              >
                <Calendar
                  size={24}
                  className={activeTab === 'rents' ? 'text-teal-600' : 'text-slate-400'}
                />
                <span className={clsx("text-[10px] font-medium", activeTab === 'rents' ? 'text-teal-600' : 'text-slate-400')}>
                  Rents
                </span>
              </Link>
            </li>
          )}

          {/* Profile / User (Triggers Offcanvas) */}
          <li>
            <button
              onClick={toggleDropdown}
              className="flex flex-col items-center space-y-1 group p-2 min-w-[64px] focus:outline-none"
            >
              {isLoggedIn ? (
                <div className={clsx(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-200",
                  activeTab === 'profile' ? "bg-teal-600" : "bg-slate-400"
                )}>
                  {getInitials()}
                </div>
              ) : (
                <UserIcon
                  size={24}
                  className={activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400'}
                />
              )}
              
              <span className={clsx("text-[10px] font-medium", activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400')}>
                {isLoggedIn ? 'Profile' : 'User'}
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Render Dropdown Outside Nav to avoid Z-Index issues */}
      <UserDropdown 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
        // This className handles specific tweaks for desktop reuse if needed, 
        // but mobile styles are handled inside UserDropdown via md:hidden classes
        className="" 
      />
    </>
  )
}

export default NavBarBottom