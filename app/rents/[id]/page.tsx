'use client'

import Image from 'next/image'
import { useState, useEffect, use } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import BarProperty from '@/components/BarProperty'
import ImageGallery from '@/components/ImageGallery'
import MapViewer from '@/components/MapViewer'
import SignatureModal from '@/components/SignatureModal'
import { Download, Share, Calendar, User, MapPin, Home, PenTool } from 'lucide-react'
import { ShareService } from '@/utils/shareService'
import useAuthStore from '@/stores/authStore'
import { createApiUrl } from '@/utils/apiConfig'
import { agreementApi } from '@/utils/agreementsApiClient'

interface BookingDetail {
  id: string
  startDate: string
  endDate: string
  rentAmount: string
  currencyCode: string
  securityDeposit: string | null
  status: string
  notes: string
  createdAt: string
  updatedAt: string
  propertyId: string
  tenantId: string
  landlordId: string
  property: {
    id: string
    title: string
    description: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    price: string
    currencyCode: string
    bedrooms: number
    bathrooms: number
    areaSqm: number
    furnished: boolean
    isAvailable: boolean
    images: string[]
    latitude: number
    longitude: number
    placeId: string | null
    projectName: string | null
    developer: string | null
    code: string
    status: string
    createdAt: string
    updatedAt: string
    ownerId: string
    propertyTypeId: string
    amenities: Array<{
      propertyId: string
      amenityId: string
      amenity: {
        id: string
        name: string
        category: string
      }
    }>
  }
  tenant: {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
    phone: string
  }
  landlord: {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
    phone: string
  }
  agreement?: {
    id: string
    status: string
  }
}

interface BookingResponse {
  success: boolean
  data: {
    booking: BookingDetail
  }
}

function RentDetailPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const { isLoggedIn, user } = useAuthStore()

  // Agreement State
  const [agreementStatus, setAgreementStatus] = useState<any>(null)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false)
  const [isAgreementLoading, setIsAgreementLoading] = useState(false)

  // 1. Fetch Booking
  useEffect(() => {
    const fetchBookingDetail = async () => {
      if (!isLoggedIn || !id) {
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

        const response = await fetch(`/api/bookings/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch booking details: ${response.status}`)
        }

        const data: BookingResponse = await response.json()
        
        if (data.success) {
          setBooking(data.data.booking)
          if (data.data.booking.agreement) {
             setAgreementStatus(data.data.booking.agreement)
          }
        } else {
          setError('Failed to load booking details')
        }
      } catch (err) {
        console.error('Error fetching booking details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load booking details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookingDetail()
  }, [id, isLoggedIn])

  // 2. Fetch/Refresh Agreement Status
  const refreshAgreementStatus = async () => {
    if (!booking) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    setIsAgreementLoading(true);
    const res = await agreementApi.getAgreementStatus(booking.id, token);
    
    if (res.success && res.data) {
        setAgreementStatus(res.data);
        if (res.data.pdf && res.data.pdf.url) {
            setDocumentUrl(res.data.pdf.url);
        }
    }
    setIsAgreementLoading(false);
  }

  // Load status once booking is ready
  useEffect(() => {
    if (booking) {
        refreshAgreementStatus();
    }
  }, [booking?.id]);

  // 3. Handle Signing Logic
  const handleSignAgreement = async (file: File) => {
    if (!booking || !agreementStatus) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const role = user?.id === booking.tenantId ? 'tenant' : 'landlord';

    try {
        if (agreementStatus.id) {
            const res = await agreementApi.uploadSignature(agreementStatus.id, role, file, token);
            
            if (res.success) {
                alert("Signature uploaded successfully!");
                await refreshAgreementStatus();
                setIsSignModalOpen(false);
            } else {
                alert(res.message || "Upload failed");
            }
        } else {
            alert("Agreement ID missing. Please refresh the page.");
        }
    } catch (error) {
        console.error(error);
        alert("An error occurred while signing.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency === 'IDR' ? 'IDR' : 'MYR', minimumFractionDigits: 0
    }).format(num)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const invoiceNumber = id ? `INV${id.toUpperCase().slice(0, 8)}` : ''

  const handleShareableLink = async () => {
    if (!booking) return
    try {
      let pdfUrl = documentUrl
      if (agreementStatus?.pdfUrl) pdfUrl = agreementStatus.pdfUrl;
      
      if (!pdfUrl) {
        alert('Document not available for sharing')
        return
      }

      const shareData = {
        title: `Rental Agreement - ${booking.property.title}`,
        text: `Rental agreement for ${booking.property.title}. Status: ${booking.status}`,
        url: pdfUrl
      }

      const success = await ShareService.share(shareData, {
        showToast: true, fallbackMessage: 'Link copied!'
      })
      if (success) console.log('Shared successfully')
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleDownloadDocument = async () => {
    if (!booking) return
    try {
      setIsDownloading(true)
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('Token not found')

      const response = await fetch(createApiUrl(`bookings/${booking.id}/rental-agreement`), {
        method: 'GET',
        headers: { 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || `Failed to fetch: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.data.pdf) {
        setDocumentUrl(data.data.pdf.url)
        const link = document.createElement('a')
        link.href = data.data.pdf.url
        link.download = data.data.pdf.fileName || 'agreement.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        throw new Error('PDF data missing')
      }
    } catch (error: any) {
      console.error('Error downloading:', error)
      alert(error.message || 'Failed to download agreement.')
    } finally {
      setIsDownloading(false)
    }
  }

  const renderAgreementAction = () => {
    if (isAgreementLoading) return <p className="text-sm text-slate-500">Checking status...</p>;
    
    const status = agreementStatus?.status || 'NOT_INITIALIZED';
    const isTenant = user?.id === booking?.tenantId;
    const isLandlord = user?.id === booking?.landlordId;

    const baseButtonClass = "w-full flex items-center justify-center space-x-2 font-medium py-3 px-4 rounded-xl transition-colors duration-200 text-sm sm:text-base";

    if (status === 'COMPLETED') {
        return (
            <button
              onClick={handleDownloadDocument}
              disabled={isDownloading}
              className={`${baseButtonClass} bg-teal-600 hover:bg-teal-700 text-white`}
            >
              <Download size={16} />
              <span>{isDownloading ? 'Downloading...' : 'Download Signed Agreement'}</span>
            </button>
        );
    }

    if (status === 'PENDING_TENANT') {
        if (isTenant) {
            return (
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className={`${baseButtonClass} bg-blue-600 hover:bg-blue-700 text-white`}
                >
                  <PenTool size={16} />
                  <span>Sign Agreement (Tenant)</span>
                </button>
            );
        }
        return <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg text-center">Waiting for Tenant to sign...</p>;
    }

    if (status === 'PENDING_LANDLORD') {
        if (isLandlord) {
            return (
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className={`${baseButtonClass} bg-blue-600 hover:bg-blue-700 text-white`}
                >
                  <PenTool size={16} />
                  <span>Sign & Finalize (Landlord)</span>
                </button>
            );
        }
        return <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg text-center">Waiting for Landlord to sign...</p>;
    }

    return <p className="text-sm text-slate-400 text-center">Agreement not initialized.</p>;
  };

  if (!isLoggedIn) {
    return (
      <ContentWrapper>
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center space-y-6 max-w-md">
            <h3 className="text-xl font-sans font-medium text-slate-900">Please log in to view booking details</h3>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600">Loading booking details...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  if (error || !booking) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20 px-4">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error || 'Booking not found'}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">Try Again</button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <BarProperty title={`${booking.property.title} - ${invoiceNumber}`} />

      <section className="space-y-6 pb-20">
        <ImageGallery images={booking.property.images as [string, string, string, string, string]} />

        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{booking.property.title}</h1>
                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-slate-600 text-sm">
                <div className="flex items-center space-x-1">
                  <Home size={16} />
                  <span>{booking.property.bedrooms} Bed • {booking.property.bathrooms} Bath • {booking.property.areaSqm} sqm</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span className="truncate max-w-[200px]">{booking.property.address}, {booking.property.city}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 md:p-6 space-y-4 text-sm sm:text-base">
              <h3 className="text-lg font-semibold text-slate-900">Booking Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar size={18} className="text-slate-500 shrink-0" />
                  <div><p className="text-xs text-slate-500">Period</p><p className="font-medium text-slate-900">{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</p></div>
                </div>
                <div className="flex items-center space-x-3">
                  <User size={18} className="text-slate-500 shrink-0" />
                  <div><p className="text-xs text-slate-500">Landlord</p><p className="font-medium text-slate-900">{booking.landlord.name}</p></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full shrink-0"></div>
                  <div><p className="text-xs text-slate-500">Total Amount</p><p className="font-medium text-slate-900">{formatAmount(booking.rentAmount, booking.currencyCode)}</p></div>
                </div>
              </div>
              {booking.notes && (<div><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-slate-700">{booking.notes}</p></div>)}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Property Description</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{booking.property.description}</p>
            </div>

            {booking.property.amenities && booking.property.amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {booking.property.amenities.map((amenity) => (
                    <div key={amenity.amenityId} className="flex items-center space-x-2 text-slate-600 text-sm">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span>{amenity.amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 shrink-0">
                  <PenTool size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Rental Agreement</h3>
                  <p className="text-xs text-slate-500">Status: {agreementStatus?.status?.replace('_', ' ') || 'Checking...'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="block text-xs font-medium text-slate-700 uppercase tracking-wide">Document Link</p>
                  <div className="flex items-center space-x-2">
                    <input type="text" value={documentUrl || (agreementStatus?.status === 'COMPLETED' ? 'Document ready to share' : 'Complete signing to share')} readOnly className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 truncate" />
                    <button onClick={handleShareableLink} disabled={agreementStatus?.status !== 'COMPLETED'} className={`p-2 rounded-lg transition-colors ${agreementStatus?.status !== 'COMPLETED' ? 'text-slate-400 bg-slate-100 cursor-not-allowed' : 'text-teal-600 bg-teal-50 hover:bg-teal-100'}`} title="Share document"><Share size={18} /></button>
                  </div>
                </div>

                {renderAgreementAction()}

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">Invoice Reference</p>
                  <p className="font-mono font-medium text-slate-700 mt-1">{invoiceNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 py-8 px-4 md:px-0">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl text-teal-900">Where you will be</h2>
          <p className="text-base text-slate-600">{booking.property.address}, {booking.property.city}</p>
        </div>
        <div className="w-full h-64 md:h-80 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          {booking.property.latitude && booking.property.longitude ? (
            <MapViewer center={{ lng: booking.property.longitude, lat: booking.property.latitude }} zoom={15} style="streets-v2" className="w-full h-full" height="100%" width="100%" markers={[{ lng: booking.property.longitude, lat: booking.property.latitude, popup: `<div class="p-3"><h3 class="font-semibold text-slate-900 mb-2">${booking.property.title}</h3><p class="text-sm text-slate-600">${booking.property.city}</p></div>`, color: '#0d9488' }]} interactive={true} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <div className="text-center"><MapPin size={48} className="mx-auto mb-2 text-slate-400" /><p>Location not available</p></div>
            </div>
          )}
        </div>
      </section>

      <SignatureModal 
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onConfirm={handleSignAgreement}
        title="Sign Rental Agreement"
      />
    </ContentWrapper>
  )
}

export default RentDetailPage