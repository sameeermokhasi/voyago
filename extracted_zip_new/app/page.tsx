import { SiteHeader } from '@/components/site-header'
import { TravelPlanner } from '@/components/travel-planner'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <TravelPlanner />
    </main>
  )
}
