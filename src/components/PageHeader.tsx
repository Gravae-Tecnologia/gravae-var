import { PropsWithChildren } from 'react'

interface PageHeaderProps extends PropsWithChildren {
  title: string
  subTitle?: string
}

export default function PageHeader({
  title,
  subTitle,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subTitle && <span>{subTitle}</span>}
      </div>

      {children}
    </div>
  )
}
