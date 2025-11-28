import { cn } from '@/lib/utils'
import React, { InputHTMLAttributes } from 'react'

import Select from 'react-select'
import makeAnimated from 'react-select/animated'

type Option = {
  label: string
  value: unknown
}

interface MultiselectProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  options: Array<Option>
  onBlur?: React.FocusEventHandler<HTMLInputElement> | undefined
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onChange?: (value: Option) => void
  defaultValue?: string
  placeholder?: string
}

const animatedComponents = makeAnimated()

export const Multiselect: React.FC<MultiselectProps> = ({
  options,
  onBlur,
  onFocus,
  onChange,
  defaultValue,
  id,
  placeholder,
  ...rest
}) => {
  return (
    <Select
      {...rest}
      id={id}
      isMulti
      options={options}
      components={animatedComponents}
      onChange={(select) => onChange && onChange(select as unknown as Option)}
      defaultValue={options.find((option) => option.value === defaultValue)}
      placeholder={placeholder}
      classNames={{
        control: (state) =>
          cn(
            'bg-gray-700! shadow-none! rounded-md!',
            state.isFocused ? 'border-red-300!' : 'border-gray-650!',
            rest['aria-invalid'] && 'border-red-300!',
          ),
        menu: () => cn('bg-gray-700! text-white!'),
        option: () => cn('hover:bg-red-300! bg-gray-700!'),
        input: () => 'text-white!',
      }}
    />
  )
}
