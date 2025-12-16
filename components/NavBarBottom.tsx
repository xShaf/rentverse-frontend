'use client'

import Link from "next/link"
import { Search, Heart, User as UserIcon, Calendar, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import useAuthStore from '@/stores/authStore'
import UserDropdown from '@/components/UserDropdown'

type NavItem = 'explore' | 'wishlists' | 'rents' | 'login' | 'profile'

function NavBarBottom() {
  const { isLoggedIn, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<NavItem>('explore')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleTabClick = (tab: NavItem) => {
    setActiveTab(tab)
    setIsDropdownOpen(false)
  }

  // Toggle logic with stopPropagation to prevent immediate close by UserDropdown's click-outside listener
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropdownOpen(!isDropdownOpen)
    setActiveTab('profile')
  }

  const getInitials = () => {
    if (!user) return 'U'
    const first = user.firstName?.charAt(0) || ''
    const last = user.lastName?.charAt(0) || ''
    if (first && last) return (first + last).toUpperCase()
    return (user.name?.slice(0, 2) || user.email?.charAt(0) || 'U').toUpperCase()
  }

  return (
    <nav className={clsx([
        'fixed z-50',
        'block md:hidden',
        'bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe'
      ])}>
      <ul className="flex items-center justify-around py-3 px-2">
        {/* Explore */}
        <li>
          <Link
            href='/'
            onClick={() => handleTabClick('explore')}
            className="flex flex-col items-center space-y-1 group p-2"
          >
            <Search
              size={24}
              className={`transition-colors duration-200 ${
                activeTab === 'explore' 
                  ? 'text-teal-600' 
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors duration-200 ${
                activeTab === 'explore' 
                  ? 'text-teal-600' 
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            >
              Explore
            </span>
          </Link>
        </li>

        {/* Wishlists */}
        <li>
          <Link
            href='/wishlist'
            onClick={() => handleTabClick('wishlists')}
            className="flex flex-col items-center space-y-1 group p-2"
          >
            <Heart
              size={24}
              className={`transition-colors duration-200 ${
                activeTab === 'wishlists' 
                  ? 'text-teal-600' 
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors duration-200 ${
                activeTab === 'wishlists' 
                  ? 'text-teal-600' 
                  : 'text-slate-400 group-hover:text-slate-600'
              }`}
            >
              Wishlists
            </span>
          </Link>
        </li>

        {/* Rents (Only if logged in) */}
        {isLoggedIn && (
          <li>
            <Link
              href='/rents'
              onClick={() => handleTabClick('rents')}
              className="flex flex-col items-center space-y-1 group p-2"
            >
              <Calendar
                size={24}
                className={`transition-colors duration-200 ${
                  activeTab === 'rents' 
                    ? 'text-teal-600' 
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  activeTab === 'rents' 
                    ? 'text-teal-600' 
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                Rents
              </span>
            </Link>
          </li>
        )}

        {/* Login or Profile Avatar */}
        <li>
          {!isLoggedIn ? (
            <Link
              href='/auth'
              onClick={() => handleTabClick('login')}
              className="flex flex-col items-center space-y-1 group p-2"
            >
              <UserIcon
                size={24}
                className={`transition-colors duration-200 ${
                  activeTab === 'login' 
                    ? 'text-teal-600' 
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  activeTab === 'login' 
                    ? 'text-teal-600' 
                    : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                Log in
              </span>
            </Link>
          ) : (
            <div className="relative">
                <button
                    onMouseDown={toggleDropdown}
                    className="flex flex-col items-center space-y-1 group p-2 focus:outline-none"
                >
                    <div className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-200",
                        activeTab === 'profile' ? "bg-teal-600" : "bg-slate-400 group-hover:bg-slate-500"
                    )}>
                        {getInitials()}
                    </div>
                    <span
                        className={`text-[10px] font-medium transition-colors duration-200 ${
                            activeTab === 'profile' 
                              ? 'text-teal-600' 
                              : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                    >
                        Profile
                    </span>
                </button>
                
                {/* Dropdown Container - Forces upward rendering */}
                {isDropdownOpen && (
                    <div className="absolute bottom-full right-0 mb-4 z-50">
                        <UserDropdown 
                            isOpen={true} 
                            onClose={() => setIsDropdownOpen(false)} 
                            className="!top-auto !bottom-0 !mt-0 !right-[-10px] w-64 shadow-2xl border-slate-200 origin-bottom-right"
                        />
                    </div>
                )}
            </div>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default NavBarBottom