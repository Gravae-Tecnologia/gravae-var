import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Monitor } from '@/generated/prisma/client'
import { useRouter } from '@tanstack/react-router'
import { RequiredFetcher } from '@tanstack/react-start'
import { Trash } from 'lucide-react'
import React, { useState } from 'react'
import z from 'zod'

export const deleteMonitorSchema = z.object({
  id: z.number(),
})

type Values = z.infer<typeof deleteMonitorSchema>

interface DeleteMonitorDialogProps {
  values: Values
  deleteMonitor: RequiredFetcher<
    undefined,
    typeof deleteMonitorSchema,
    Promise<Monitor>
  >
}

export const DeleteMonitorDialog: React.FC<DeleteMonitorDialogProps> = ({
  deleteMonitor,
  values,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleRemoveMonitor = async () => {
    await deleteMonitor({
      data: values,
    })
    router.invalidate()
    setIsOpen(false)
  }

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
      }}
    >
      <Button variant="destructive" size={'lg'} onClick={() => setIsOpen(true)}>
        <Trash />
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remover monitor</DialogTitle>
          <DialogDescription>
            Ao continuar, o monitor será removido permanentemente do sistema.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button variant="outline">Cancelar</Button>
          </DialogClose>

          <Button
            variant={'destructive'}
            className="flex-1"
            onClick={handleRemoveMonitor}
          >
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
