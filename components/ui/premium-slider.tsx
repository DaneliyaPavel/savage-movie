/**
 * Премиум Slider для бюджета в стиле Freshman.tv
 * Editorial + cinematic feeling, крупный numeric readout с плавной анимацией
 */
'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PremiumSliderProps {
  className?: string
  defaultValue?: number[]
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

function PremiumSlider({
  className,
  defaultValue,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: PremiumSliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const currentValue = _values[0] ?? min
  const progress = ((currentValue - min) / (max - min)) * 100

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-[#1A1A1A] relative grow overflow-hidden h-[2px] w-full"
      >
        <motion.div
          className="absolute h-full bg-[#FFFFFF]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </SliderPrimitive.Track>
      {_values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-4 shrink-0 rounded-full border-2 border-[#FFFFFF] bg-[#000000] shadow-sm transition-colors hover:border-[#ff2936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2936] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000] disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { PremiumSlider }
