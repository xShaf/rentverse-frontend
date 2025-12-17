import RentClient from './RentClient'

// Required for static export support, even if empty
export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <RentClient id={resolvedParams.id} />
}