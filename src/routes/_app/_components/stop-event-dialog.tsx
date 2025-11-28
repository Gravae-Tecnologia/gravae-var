'use client'

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
import { DialogTrigger } from '@radix-ui/react-dialog'
import React, { useState } from 'react'

interface StopEventDialogProps {
  isDisabled: boolean
  onConfirm: () => Promise<void>
}

export const StopEventDialog: React.FC<StopEventDialogProps> = ({
  isDisabled,
  onConfirm,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
      }}
    >
      <DialogTrigger asChild>
        <Button
          disabled={isDisabled}
          variant="destructive"
          size={'lg'}
          onClick={() => setIsOpen(true)}
        >
          Encerrar gravação
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Encerrar gravação</DialogTitle>
          <DialogDescription>
            Você tem certeza que deseja encerrar a gravação?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button variant="destructive">Cancelar</Button>
          </DialogClose>

          <Button
            variant={'success'}
            className="flex-1"
            onClick={() => {
              onConfirm()
              setIsOpen(false)
            }}
          >
            Encerrar gravação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
