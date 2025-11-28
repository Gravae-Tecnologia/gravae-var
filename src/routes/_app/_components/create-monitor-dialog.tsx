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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { DialogTrigger } from '@radix-ui/react-dialog'
import { useRouter } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const createMonitorSchema = z.object({
  name: z.string().min(1, 'mínimo 1 caracter.'),
  monitorId: z.string().min(1, 'mínimo 1 caracter.'),
})

type FormValues = z.infer<typeof createMonitorSchema>

interface CreateMonitorDialog {
  onSubmit: (values: FormValues) => Promise<void>
}

export const CreateMonitorDialog: React.FC<CreateMonitorDialog> = ({
  onSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(createMonitorSchema),
    defaultValues: {
      name: '',
      monitorId: '',
    },
  })

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values)
    router.invalidate()
    setIsOpen(false)
  }

  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)

        if (!open) {
          form.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size={'lg'}
          onClick={() => setIsOpen(true)}
        >
          Criar monitor
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar monitor</DialogTitle>
          <DialogDescription>
            Preencha abaixo as informações corretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="monitor-form-name">Nome</FieldLabel>
                <Input
                  {...field}
                  id="monitor-form-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Digite o nome do monitor"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="monitorId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="monitor-form-monitor-id">
                  Monitor ID
                </FieldLabel>
                <Input
                  {...field}
                  id="monitor-form-monitor-id"
                  aria-invalid={fieldState.invalid}
                  placeholder="Digite o id do monitor"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild className="flex-1">
            <Button variant="destructive">Cancelar</Button>
          </DialogClose>

          <Button
            variant={'success'}
            className="flex-1"
            onClick={form.handleSubmit(handleSubmit)}
          >
            Criar monitor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
