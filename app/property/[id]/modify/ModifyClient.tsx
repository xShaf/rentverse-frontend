'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft } from 'lucide-react'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import useAuthStore from '@/stores/authStore'
import { createApiUrl } from '@/utils/apiConfig'

interface Property {
  id: string
  title: string
  description: string
  price: string
  furnished: boolean
  isAvailable: boolean
  status: string
  ownerId: string
  propertyType: { id: string; code: string; name: string }
  owner?: { id: string; name: string; email: string }
  images: string[]
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  currencyCode: string
  bedrooms: number
  bathrooms: number
  areaSqm: number
}

interface PropertyResponse {
  success: boolean
  message: string
  data: { property: Property }
}

interface ModifyClientProps {
  id: string
}

export default function ModifyClient({ id: propertyId }: ModifyClientProps) {
  const router = useRouter()
  const { propertyTypes, isLoading: isLoadingTypes } = usePropertyTypes()
  const { isLoggedIn, user } = useAuthStore()

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    price: '',
    furnished: false,
    isAvailable: true,
    status: 'APPROVED'
  })

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || !isLoggedIn || !user) {
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }

        const response = await fetch(createApiUrl(`properties/${propertyId}`), {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

        const data: PropertyResponse = await response.json()
        
        if (data.success && data.data.property) {
          const p = data.data.property
          if (user && p.ownerId !== user.id) {
            setIsUnauthorized(true)
            return
          }
          setProperty(p)
          setFormData({
            title: p.title || '',
            description: p.description || '',
            propertyType: p.propertyType?.name || '',
            price: p.price?.toString() || '',
            furnished: Boolean(p.furnished),
            isAvailable: p.isAvailable ?? true,
            status: p.status || 'APPROVED'
          })
        } else {
          setError('Failed to load property')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load property')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProperty()
  }, [propertyId, isLoggedIn, user])

  const handleSave = async () => {
    if (!isLoggedIn || !user || !property || property.ownerId !== user.id) return
    setIsSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('No token')

      const updateData: any = {}
      if (formData.title !== property.title) updateData.title = formData.title
      if (formData.description !== property.description) updateData.description = formData.description
      if (formData.price !== property.price) updateData.price = parseFloat(formData.price)
      if (formData.furnished !== property.furnished) updateData.furnished = formData.furnished
      if (formData.isAvailable !== property.isAvailable) updateData.isAvailable = formData.isAvailable
      if (formData.status !== property.status) updateData.status = formData.status

      if (Object.keys(updateData).length === 0) {
        router.back()
        return
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}`), {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error('Update failed')
      const data = await response.json()
      if (data.success) {
        router.push(`/property/all`)
      } else {
        setError('Failed to update property')
      }
    } catch (err) {
      setError('Failed to update property')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!isLoggedIn || !user || !property || property.ownerId !== user.id) return
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(createApiUrl(`properties/${propertyId}`), {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Delete failed')
      const data = await response.json()
      if (data.success) {
        router.push(`/property/all`)
      } else {
        setError('Failed to delete property')
      }
    } catch (err) {
      setError('Failed to delete property')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'furnished' || field === 'isAvailable' ? value === 'true' : value,
    }))
  }

  return (
    <ContentWrapper>
      <div className="flex items-center space-x-3 mb-8 px-4 md:px-0">
        <ButtonCircle icon={<ArrowLeft />} onClick={() => router.back()} />
        <h1 className="text-xl md:text-2xl font-sans font-medium text-slate-900">Listing editor</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      )}

      {error && (
        <div className="max-w-6xl mx-auto mb-6 px-4 md:px-0">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">{error}</div>
        </div>
      )}

      {!isLoading && isUnauthorized && (
        <div className="text-center py-20 px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">You can only modify properties that you own.</p>
          <button onClick={() => router.push('/property/all')} className="px-6 py-3 bg-teal-600 text-white rounded-xl">View All Properties</button>
        </div>
      )}

      {!isLoading && !error && isLoggedIn && !isUnauthorized && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0 pb-20">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea rows={4} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Property Type</label>
                <select value={formData.propertyType} onChange={(e) => handleInputChange('propertyType', e.target.value)} disabled={isLoadingTypes} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none">
                  <option value="">Select Type</option>
                  {propertyTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Price (MYR)</label>
                <input type="number" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Furnished</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" checked={formData.furnished === true} onChange={() => handleInputChange('furnished', 'true')} /> Yes</label>
                        <label className="flex items-center gap-2"><input type="radio" checked={formData.furnished === false} onChange={() => handleInputChange('furnished', 'false')} /> No</label>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Availability</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" checked={formData.isAvailable === true} onChange={() => handleInputChange('isAvailable', 'true')} /> Available</label>
                        <label className="flex items-center gap-2"><input type="radio" checked={formData.isAvailable === false} onChange={() => handleInputChange('isAvailable', 'false')} /> Not Available</label>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none">
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-2 break-words">{formData.title || 'Property Title'}</h2>
                <p className="text-xl font-bold text-slate-900">MYR {parseFloat(formData.price || '0').toLocaleString()} <span className="text-sm font-normal text-slate-500">/ month</span></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowDeleteModal(true)} disabled={isDeleting} className="w-full sm:w-1/2 px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-medium transition-colors">Delete Property</button>
                <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-1/2 px-4 py-3 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-medium transition-colors">{isSaving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Property?</h3>
            <p className="text-slate-600 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl">Cancel</button>
                <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  )
}