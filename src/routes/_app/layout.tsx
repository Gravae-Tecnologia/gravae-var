import Header from '@/components/Header'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Header />
      <div className="p-4 gap-4 flex flex-col items-center">
        <div className="max-w-content w-full">
          <Outlet />
        </div>
      </div>
    </>
  )
}
