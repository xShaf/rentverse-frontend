import ListFeatured from '@/components/ListFeatured'
import ContentWrapper from '@/components/ContentWrapper'
import ListPopularLocation from '@/components/ListPopularLocation'

function ListsPage() {
  return (
    <ContentWrapper searchBoxType="full">
      <div className="space-y-12 sm:space-y-20 py-8 sm:py-12">
        <section>
            <ListFeatured />
        </section>
        
        <section className="pb-12">
            <ListPopularLocation />
        </section>
      </div>
    </ContentWrapper>
  )
}

export default ListsPage