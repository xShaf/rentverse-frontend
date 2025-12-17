import ModifyClient from './ModifyClient'

export async function generateStaticParams() {
  return []
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <ModifyClient id={resolvedParams.id} />
}