import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import SearchBoxProperty from '@/components/SearchBoxProperty'
import ListFeatured from '@/components/ListFeatured'
import ListPopularLocation from '@/components/ListPopularLocation'

export default function Home() {
  return (
    <div>
      <ContentWrapper>
        {/* Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] flex justify-center">
          <div className="absolute inset-0 z-0">
            <Image
              width={1440}
              height={600}
              alt="Hero Background"
              className="w-full h-full object-cover bg-top hidden md:block"
              src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758183708/rentverse-base/hero_bg_desktop_z8j6pg.png"
              priority
            />
            <Image
              width={320}
              height={600}
              alt="Hero Background"
              className="w-full h-full object-cover md:hidden"
              src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758183708/rentverse-base/hero_bg_mobile_s4xpxr.png"
              priority
            />
          </div>

          <div className="relative z-10 text-center w-full max-w-4xl mx-auto px-4 mt-16 md:mt-24">
            <h1 className="mx-auto font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-teal-900 mb-4 max-w-2xl leading-tight">
              The right home is waiting for you
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-teal-700 mb-8 mx-auto max-w-lg px-2">
              Explore thousands of apartments, condominiums, and houses for rent across the country.
            </p>
            
            <div className="w-full max-w-2xl mx-auto">
              <SearchBoxProperty />
            </div>

            <Image
              src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758186240/rentverse-base/sample-dashboard_h7ez5z.png"
              alt="Search Results Sample on Rentverse"
              width={1080}
              height={720}
              className="my-12 md:my-20 rounded-lg shadow-lg z-10 w-full h-auto"
            />
          </div>
        </section>

        {/* Trusted Section */}
        <section className="py-12 md:py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-serif text-slate-800 text-center mb-8 md:mb-12">
              Trusted by Thousands of Tenants and Property Owners
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 items-start md:items-center">
              {[
                { count: '10,000+', label: 'Listed properties', icon: 'icon-key-property_nkanqy.png' },
                { count: '200+', label: 'Strategic locations', icon: 'icon-location_yzbsol.png' },
                { count: '98%', label: 'User satisfaction rate', icon: 'icon-rating_nazm4g.png' },
                { count: '5,000+', label: 'Verified users', icon: 'icon-check_poswwx.png' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-center md:justify-start gap-x-4 bg-white md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none shadow-sm md:shadow-none">
                  <Image
                    src={`https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758187014/rentverse-base/${item.icon}`}
                    width={48}
                    height={48}
                    alt={item.label}
                    className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xl md:text-3xl font-bold text-slate-800 mb-1">{item.count}</span>
                    <p className="text-xs md:text-base text-slate-600">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <ListFeatured />
        <ListPopularLocation />
      </ContentWrapper>
    </div>
  )
}