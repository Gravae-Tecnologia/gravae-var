import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { findManyEvent } from '@/services/find-many-event'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  component: App,
  loader: async () => await findManyEvent(),
})

function App() {
  const router = useRouter()
  const events = Route.useLoaderData()

  return (
    <>
      <PageHeader
        title="Acompanhar eventos"
        subTitle="Acompanhe os eventos e gerencie as gravações."
      >
        <Button
          size={'lg'}
          variant={'destructive'}
          onClick={() =>
            router.navigate({
              from: '/event',
            })
          }
        >
          Criar gravação
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 mt-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        {events.map((event) => (
          <Link
            to="/event/$eventId"
            params={{
              eventId: String(event.id),
            }}
            key={event.id}
            className="bg-gray-900 rounded-lg overflow-clip"
          >
            <div className="aspect-video flex items-center justify-center">
              {event.status === 'RECORDING' ? (
                <span className="bg-green-400 text-sm p-2 rounded-full">
                  GRAVAÇÃO EM ANDAMENTO
                </span>
              ) : (
                <span className="bg-gray-650 text-sm p-2 rounded-full">
                  GRAVAÇÃO ENCERRADA
                </span>
              )}
            </div>

            <div className="bg-gray-950/70 p-4">
              <span>{event.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
