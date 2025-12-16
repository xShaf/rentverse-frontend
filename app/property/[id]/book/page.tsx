'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft, Plus, Minus } from 'lucide-react'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import { Property } from '@/types/property'
import useAuthStore from '@/stores/authStore'

function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { isLoggedIn } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(true)

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    numGuests: 1,
    message: '',
    totalAmount: 0
  })

  const [startMonthCount, setStartMonthCount] = useState(0)
  const [durationMonths, setDurationMonths] = useState(1)

  const getPropertyPrice = useCallback(() => {
    if (!property) return 0
    return typeof property.price === 'string' ? parseFloat(property.price) : property.price
  }, [property])

  const updateDatesFromCounters = useCallback((startMonth: number, duration: number) => {
    const currentDate = new Date()
    let startDate: Date
    if (startMonth === 0) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      startDate = tomorrow
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + startMonth, 1)
    }
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + duration, 0)
    
    const monthlyPrice = getPropertyPrice()
    const totalAmount = monthlyPrice * duration
    
    setFormData(prev => ({
      ...prev,
      checkIn: startDate.toISOString().split('T')[0],
      checkOut: endDate.toISOString().split('T')[0],
      totalAmount: totalAmount
    }))
  }, [getPropertyPrice])

  const incrementStartMonth = () => {
    setStartMonthCount(prev => prev + 1)
    updateDatesFromCounters(startMonthCount + 1, durationMonths)
  }

  const decrementStartMonth = () => {
    if (startMonthCount > 0) {
      setStartMonthCount(prev => prev - 1)
      updateDatesFromCounters(startMonthCount - 1, durationMonths)
    }
  }

  const incrementDuration = () => {
    setDurationMonths(prev => prev + 1)
    updateDatesFromCounters(startMonthCount, durationMonths + 1)
  }

  const decrementDuration = () => {
    if (durationMonths > 1) {
      setDurationMonths(prev => prev - 1)
      updateDatesFromCounters(startMonthCount, durationMonths - 1)
    }
  }

  const getStartMonthText = () => {
    const currentDate = new Date()
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + startMonthCount, 1)
    return targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getDurationText = () => durationMonths === 1 ? '1 month' : `${durationMonths} months`

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return
      try {
        setIsLoadingProperty(true)
        const viewResponse = await PropertiesApiClient.logPropertyView(propertyId)
        if (viewResponse.success && viewResponse.data.property) {
          const backendProperty = viewResponse.data.property
          setProperty(backendProperty)
          const price = typeof backendProperty.price === 'string' 
            ? parseFloat(backendProperty.price) 
            : backendProperty.price
          setFormData(prev => ({ ...prev, totalAmount: price || 0 }))
        } else {
          setSubmitError('Failed to load property details')
          setProperty(null)
        }
      } catch (error) {
        console.error(error)
        setSubmitError('Failed to load property details.')
      } finally {
        setIsLoadingProperty(false)
      }
    }
    if (propertyId) fetchProperty()
  }, [propertyId])

  useEffect(() => {
    if (property) updateDatesFromCounters(startMonthCount, durationMonths)
  }, [property, startMonthCount, durationMonths, updateDatesFromCounters])

  const handleNext = () => { if (currentStep < 4) setCurrentStep(currentStep + 1) }
  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1) }

  const handleSubmitBooking = async () => {
    if (!formData.checkIn || !formData.checkOut) {
      setSubmitError('Please select booking dates')
      return
    }
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const token = localStorage.getItem('authToken')
      if (!token || !isLoggedIn) {
        router.push('/auth/login')
        return
      }

      const bookingData = {
        propertyId: propertyId,
        startDate: new Date(formData.checkIn + 'T12:00:00.000Z').toISOString(),
        endDate: new Date(formData.checkOut + 'T23:59:59.000Z').toISOString(),
        rentAmount: formData.totalAmount || 0,
        securityDeposit: 0,
        notes: formData.message || ""
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) throw new Error(`Booking failed`)
      
      const result = await response.json()
      if (result && (result.id || result.success)) {
        setCurrentStep(4)
        setTimeout(() => router.push('/rents'), 2000)
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingProperty) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <div className="flex items-center space-x-3 mb-6 px-4 md:px-0">
        <ButtonCircle icon={<ArrowLeft />} onClick={() => router.back()} />
        <h1 className="text-xl md:text-2xl font-sans font-medium text-slate-900">Request to book</h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0 pb-20">
        {/* Left side - Form */}
        <div className="space-y-8 order-2 lg:order-1">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">1. Add payment method</h2>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs font-bold flex items-center justify-center">VISA</div>
                  <span className="text-slate-600 text-sm md:text-base">Visa credit card</span>
                </div>
                <button className="text-teal-600 font-medium text-sm">Change</button>
              </div>
              <div className="flex justify-end">
                <button onClick={handleNext} className="w-full sm:w-auto px-6 py-3 bg-teal-600 text-white rounded-xl font-medium">Next</button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">2. Booking details</h2>
              
              {/* Start Month */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Month</label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-4 bg-white">
                  <div>
                    <div className="font-medium text-slate-900">{getStartMonthText()}</div>
                    <div className="text-sm text-slate-500">Starting month</div>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <button onClick={decrementStartMonth} disabled={startMonthCount === 0} className="p-2 border rounded-full hover:bg-slate-50 disabled:opacity-50"><Minus size={16}/></button>
                    <span className="w-4 text-center font-medium">{startMonthCount}</span>
                    <button onClick={incrementStartMonth} className="p-2 border rounded-full hover:bg-slate-50"><Plus size={16}/></button>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration</label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-4 bg-white">
                  <div>
                    <div className="font-medium text-slate-900">{getDurationText()}</div>
                    <div className="text-sm text-slate-500">Rental duration</div>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <button onClick={decrementDuration} disabled={durationMonths === 1} className="p-2 border rounded-full hover:bg-slate-50 disabled:opacity-50"><Minus size={16}/></button>
                    <span className="w-4 text-center font-medium">{durationMonths}</span>
                    <button onClick={incrementDuration} className="p-2 border rounded-full hover:bg-slate-50"><Plus size={16}/></button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handlePrevious} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium">Previous</button>
                <button onClick={handleNext} className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium">Next</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">3. Message to host</h2>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                placeholder="Introduce yourself..."
                className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <div className="flex gap-4">
                <button onClick={handlePrevious} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium">Previous</button>
                <button onClick={handleNext} className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium">Next</button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">4. Review request</h2>
              <div className="bg-slate-50 p-5 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between"><span>Check-in:</span> <span className="font-medium">{new Date(formData.checkIn).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Check-out:</span> <span className="font-medium">{new Date(formData.checkOut).toLocaleDateString()}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span>Total:</span> <span className="font-bold text-lg text-teal-600">RM {formData.totalAmount}</span></div>
              </div>
              {submitError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{submitError}</div>}
              <div className="flex gap-4">
                <button onClick={handlePrevious} disabled={isSubmitting} className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium disabled:opacity-50">Previous</button>
                <button onClick={handleSubmitBooking} disabled={isSubmitting} className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Property Summary */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex gap-4 mb-4">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                {property?.images?.[0] && (
                  <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 truncate">{property?.city}, {property?.country}</p>
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{property?.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{property?.type}</p>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Monthly</span> <span>RM {getPropertyPrice()}</span></div>
              <div className="flex justify-between text-sm"><span>Duration</span> <span>{getDurationText()}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100">
                <span>Total</span> <span>RM {formData.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentWrapper>
  )
}

export default BookingPage