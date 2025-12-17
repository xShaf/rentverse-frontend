import PropertyDetailsClient from './PropertyDetailsClient'

// Required for static export (Mobile/PWA Build support)
export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <PropertyDetailsClient id={resolvedParams.id} />
}