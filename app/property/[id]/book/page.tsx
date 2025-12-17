import BookingClient from './BookingClient'

export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <BookingClient id={resolvedParams.id} />
}