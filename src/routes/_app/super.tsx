import PageHeader from '@/components/PageHeader'
import { prisma } from '@/db'
import { findManyMonitor } from '@/services/find-many-monitor'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  CreateMonitorDialog,
  createMonitorSchema,
} from './_components/create-monitor-dialog'
import {
  DeleteMonitorDialog,
  deleteMonitorSchema,
} from './_components/delete-monitor-dialog'

const createMonitor = createServerFn({
  method: 'POST',
})
  .inputValidator(createMonitorSchema)
  .handler(async ({ data }) => {
    return await prisma.monitor.create({
      data,
    })
  })

const deleteMonitor = createServerFn({
  method: 'POST',
})
  .inputValidator(deleteMonitorSchema)
  .handler(async ({ data }) => {
    return await prisma.monitor.delete({
      where: {
        id: data.id,
      },
    })
  })

export const Route = createFileRoute('/_app/super')({
  component: App,
  loader: async () => await findManyMonitor(),
})

function App() {
  const monitors = Route.useLoaderData()

  return (
    <>
      <PageHeader
        title="Gerenciamento de monitores"
        subTitle="Acompanhe e gerencie os monitores."
      >
        <div>
          <CreateMonitorDialog
            onSubmit={async (values) => {
              await createMonitor({
                data: values,
              })
            }}
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-4 mt-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {monitors.map((monitor) => (
          <div
            key={monitor.id}
            className="flex flex-col gap-4 bg-gray-700 pb-4 rounded-md overflow-clip"
          >
            <div className="aspect-video bg-gray-800">
              <video src={monitor.url || ''} />
            </div>

            <div className="flex justify-between items-center px-4">
              <span>{monitor.name}</span>{' '}
              <DeleteMonitorDialog
                deleteMonitor={deleteMonitor}
                values={{
                  id: monitor.id,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
