import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subTitle?: string
}

export default function PageHeader({
  title,
  subTitle,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between z-999', className)}>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subTitle && <span>{subTitle}</span>}
      </div>

      {children}
    </div>
  )
}
