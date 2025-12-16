'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import { Calendar, User, MapPin, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

interface BookingItem {
  id: string
  startDate: string
  endDate: string
  rentAmount: string
  currencyCode: string
  status: string
  createdAt: string
  property: {
    id: string
    title: string
    address: string
    city: string
    images: string[]
  }
  tenant: {
    id: string
    name: string
    email: string
    phone: string
  }
  agreement?: {
    status: string
  }
}

export default function LandlordBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoggedIn, user } = useAuthStore()

  useEffect(() => {
    const fetchOwnerBookings = async () => {
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) throw new Error('No token found')

        const response = await fetch('/api/bookings/owner-bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) throw new Error('Failed to fetch bookings')

        const data = await response.json()
        if (data.success) {
          setBookings(data.data.bookings)
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load bookings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOwnerBookings()
  }, [isLoggedIn])

  const getStatusBadge = (booking: BookingItem) => {
    const agreementStatus = booking.agreement?.status || 'NOT_INITIALIZED';
    
    if (agreementStatus === 'PENDING_LANDLORD') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
          <AlertCircle size={12} className="mr-1" />
          Action Required
        </span>
      )
    }
    
    if (agreementStatus === 'PENDING_TENANT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
          <Clock size={12} className="mr-1" />
          Waiting Tenant
        </span>
      )
    }

    if (booking.status === 'APPROVED' || agreementStatus === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
          <CheckCircle size={12} className="mr-1" />
          Active
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
        {booking.status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  if (!isLoggedIn) {
    return (
      <ContentWrapper>
        <div className="text-center py-20 px-4">
          <h2 className="text-xl font-semibold">Please log in to manage bookings</h2>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="py-8 space-y-6 px-4 md:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Incoming Bookings</h1>
            <p className="text-sm text-slate-600">Manage requests and sign agreements for your properties</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-slate-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No bookings yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              When tenants book your properties, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 pb-20">
            {bookings.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row gap-5"
              >
                {/* Property Image */}
                <div className="relative w-full sm:w-48 h-40 sm:h-auto bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {booking.property.images?.[0] ? (
                    <Image
                      src={booking.property.images[0]}
                      alt={booking.property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <MapPin size={24} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{booking.property.title}</h3>
                      <p className="text-slate-500 text-sm flex items-center mt-1">
                        <MapPin size={14} className="mr-1 shrink-0" />
                        <span className="truncate">{booking.property.city}</span>
                      </p>
                    </div>
                    <div className="self-start sm:self-auto">
                        {getStatusBadge(booking)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-sm">
                    <div className="flex items-center text-slate-600">
                      <User size={16} className="mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">Tenant: <span className="font-medium text-slate-900">{booking.tenant.name}</span></span>
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Calendar size={16} className="mr-2 text-slate-400 shrink-0" />
                      <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:justify-center gap-4 sm:border-l sm:border-slate-100 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-lg font-bold text-slate-900 whitespace-nowrap">
                    {booking.currencyCode} {parseFloat(booking.rentAmount).toLocaleString()}
                  </div>
                  <Link 
                    href={`/rents/${booking.id}`}
                    className="ml-auto sm:ml-0 flex items-center justify-center w-auto sm:w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    Manage <ArrowRight size={14} className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentWrapper>
  )
}